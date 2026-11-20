param([string]$Server='DESKTOP-I03QOJG',[string]$SourceDatabase='SmartClinic')
$ErrorActionPreference='Stop'
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$testDb='SmartClinicClinicTest_'+[guid]::NewGuid().ToString('N')
if($SourceDatabase -notmatch '^[A-Za-z0-9_]+$'){throw 'Invalid source database name'}
$out=Join-Path $root '.tmp-plan/schedule-test'
New-Item -ItemType Directory -Force $out | Out-Null
function Sql([string]$query,[string]$database='master') {
 $result=& sqlcmd -S $Server -E -C -d $database -l 5 -b -Q $query 2>&1
 if($LASTEXITCODE -ne 0){throw ($result -join "`n")}
}
function Encode([byte[]]$bytes){[Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')}
$key=[guid]::NewGuid().ToString('N')+[guid]::NewGuid().ToString('N')
function Token([string]$id,[string]$role){
 $header=Encode ([Text.Encoding]::UTF8.GetBytes('{"alg":"HS256","typ":"JWT"}'))
 $payload=Encode ([Text.Encoding]::UTF8.GetBytes((@{sub=$id;role=$role;iss='ClinicTest';aud='ClinicTest';exp=[DateTimeOffset]::UtcNow.AddMinutes(10).ToUnixTimeSeconds()}|ConvertTo-Json -Compress)))
 $hmac=[Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($key))
 try{$signature=Encode ($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$header.$payload")))}finally{$hmac.Dispose()}
 "$header.$payload.$signature"
}
$admin='11111111-1111-1111-1111-111111111111';$doctor='22222222-2222-2222-2222-222222222222';$patient='33333333-3333-3333-3333-333333333333';$other='44444444-4444-4444-4444-444444444444'
$process=$null;$count=0
function Call([string]$method,[string]$path,[int]$status,[object]$body=$null,[string]$token=''){
 $params=@{Uri="http://localhost:5300/api/clinic/$path";Method=$method;SkipHttpErrorCheck=$true;TimeoutSec=20}
 if($token){$params.Headers=@{Authorization="Bearer $token"}}
 if($null-ne$body){$params.ContentType='application/json';$params.Body=$body|ConvertTo-Json -Depth 10 -Compress}
 $response=Invoke-WebRequest @params
 $content=if($response.Content -is [byte[]]){[Text.Encoding]::UTF8.GetString($response.Content)}else{$response.Content}
 if([int]$response.StatusCode -ne $status){throw "$method $path expected $status got $($response.StatusCode): $content"}
 $script:count++;if($content){return ConvertFrom-Json -InputObject $content -NoEnumerate}
}
try{
 Sql "CREATE DATABASE [$testDb]"
 foreach($table in @('Users','PatientProfiles','Specialties','Departments','DoctorDepartments','Appointments')){Sql "SELECT TOP(0) * INTO dbo.[$table] FROM [$SourceDatabase].dbo.[$table]" $testDb}
 Sql "SELECT TOP(0) UserId,SpecialtyId,Bio,ConsultationFee INTO dbo.DoctorProfiles FROM [$SourceDatabase].dbo.DoctorProfiles" $testDb
 foreach($iteration in 1..2){
  & sqlcmd -S $Server -E -C -d $testDb -b -i (Join-Path $root 'SmartClinic.Backend/database/20261120_specialty_management.sql') | Out-Null
  if($LASTEXITCODE -ne 0){throw 'Specialty migration failed'}
 }
 Sql @"
 IF NOT EXISTS (SELECT 1 FROM sys.default_constraints dc JOIN sys.columns c ON c.object_id=dc.parent_object_id AND c.column_id=dc.parent_column_id WHERE dc.parent_object_id=OBJECT_ID('dbo.Specialties') AND c.name='IsActive')
 ALTER TABLE dbo.Specialties ADD CONSTRAINT DF_TestSpecialties_IsActive DEFAULT(1) FOR IsActive;
 ALTER TABLE dbo.DoctorProfiles ADD PRIMARY KEY(UserId);
 ALTER TABLE dbo.Departments ADD PRIMARY KEY(Id);
 CREATE TABLE dbo.TimeSlots (Id uniqueidentifier NOT NULL PRIMARY KEY,DoctorId uniqueidentifier NOT NULL,StartTime datetime NOT NULL,EndTime datetime NOT NULL,IsBooked bit NULL,RowVersion rowversion NOT NULL);
 SET IDENTITY_INSERT dbo.Specialties ON;
 INSERT dbo.Specialties(Id,Name,WorkspaceType,IsActive) VALUES(1,N'Test Specialty','Consultation',1);
 SET IDENTITY_INSERT dbo.Specialties OFF;
 INSERT dbo.Users(Id,Email,PasswordHash,Role,PhoneNumber,IsActive) VALUES
 ('$admin','admin@clinic.test','unused','Admin','0900000000',1),('$doctor','doctor@clinic.test','unused','Doctor','0900000001',1),
 ('$patient','patient@clinic.test','unused','Patient','0900000002',1),('$other','other@clinic.test','unused','Patient','0900000003',1);
 INSERT dbo.DoctorProfiles(UserId,SpecialtyId) VALUES('$doctor',1);
 INSERT dbo.PatientProfiles(UserId,FullName,DOB,Address,Gender,IdentityCard) VALUES('$patient',N'Test Patient','2000-01-01',N'Test Address',N'Nam','012345678901'),('$other',N'Other Patient','2000-01-01',N'Test Address',N'Nam','012345678902');
"@ $testDb
 & sqlcmd -S $Server -E -C -d $testDb -b -i (Join-Path $root 'SmartClinic.Backend/database/20261119_doctor_management.sql') | Out-Null
 if($LASTEXITCODE-ne 0){throw 'Migration failed'}
 & sqlcmd -S $Server -E -C -d $testDb -b -i (Join-Path $root 'SmartClinic.Backend/database/20261119_doctor_management.sql') | Out-Null
 if($LASTEXITCODE-ne 0){throw 'Migration rerun failed'}
 $env:ASPNETCORE_ENVIRONMENT='Development';$env:MobileDevelopment__AllowHttp='true';$env:ASPNETCORE_URLS='http://localhost:5300'
 $env:Jwt__SigningKey=$key;$env:Jwt__Issuer='ClinicTest';$env:Jwt__Audience='ClinicTest'
 $env:ConnectionStrings__DefaultConnection="Server=$Server;Database=$testDb;Integrated Security=True;TrustServerCertificate=True"
 $process=Start-Process dotnet -ArgumentList (Join-Path $root '.tmp-plan/specialty-build/SmartClinic.API.dll') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $out 'server.log') -RedirectStandardError (Join-Path $out 'error.log')
 for($i=0;$i-lt 40;$i++){try{Invoke-WebRequest http://localhost:5300/api/clinic/departments -TimeoutSec 1|Out-Null;break}catch{Start-Sleep -Milliseconds 250}}
 $at=Token $admin 'Admin';$pt=Token $patient 'Patient';$ot=Token $other 'Patient'
 $null=Call GET '../admin/specialties' 401
 $null=Call GET '../admin/specialties' 403 $null $pt
 $specialty=@{name='New Specialty';description='Test description';workspaceType='Consultation';isActive=$true}
 $createdSpecialty=Call POST '../admin/specialties' 200 $specialty $at
 $null=Call POST '../admin/specialties' 409 $specialty $at
 $specialty.name=' new specialty '
 $null=Call POST '../admin/specialties' 409 $specialty $at
 $specialty.name='Renamed Specialty';$specialty.isActive=$false
 $null=Call PUT "../admin/specialties/$($createdSpecialty.id)" 200 $specialty $at
 $lookup=Call GET '../admin/accounts/specialties' 200 $null $at
 if(@($lookup | Where-Object id -eq $createdSpecialty.id).Count -ne 0){throw 'Inactive specialty exposed in lookup'}
 $all=Call GET '../admin/specialties' 200 $null $at
 if(($all | Where-Object id -eq $createdSpecialty.id).isActive -ne $false){throw 'Inactive status not persisted'}
 $specialty.isActive=$true
 $null=Call PUT "../admin/specialties/$($createdSpecialty.id)" 200 $specialty $at
 $lookup=Call GET '../admin/accounts/specialties' 200 $null $at
 if(@($lookup | Where-Object id -eq $createdSpecialty.id).Count -ne 1){throw 'Reactivated specialty absent'}
 $specialty.workspaceType='Invalid'
 $null=Call PUT "../admin/specialties/$($createdSpecialty.id)" 400 $specialty $at
 $null=Call DELETE '../admin/specialties/1' 409 $null $at
 $existing=@{name='Test Specialty';workspaceType='Consultation';isActive=$false}
 $null=Call PUT '../admin/specialties/1' 200 $existing $at
 $null=Call PUT "../admin/accounts/$doctor/role" 204 @{role='Doctor';specialtyId=1} $at
 $null=Call POST '../admin/accounts' 400 @{email='inactive@clinic.test';password='TestPassword123!';fullName='Test';role='Doctor';specialtyId=1} $at
 $existing.isActive=$true
 $null=Call PUT '../admin/specialties/1' 200 $existing $at
 $null=Call DELETE "../admin/specialties/$($createdSpecialty.id)" 204 $null $at
 $null=Call DELETE "../admin/specialties/$($createdSpecialty.id)" 404 $null $at
 $null=Call POST departments 401 @{code='TEST';name='Test';isActive=$true}
 $null=Call POST departments 403 @{code='TEST';name='Test';isActive=$true} $pt
 $dept=Call POST departments 200 @{code='TEST';name='Test Department';isActive=$true} $at
 $null=Call POST departments 409 @{code='TEST';name='Duplicate';isActive=$true} $at
 $d=@{fullName='Test Doctor';departmentId=$dept.id;title='BS';position='Doctor';bio='Public biography';expertise='Test';education='School';workHistory='Hospital';certificates='Certificate';consultationFee=100000;isPublished=$false;isFeatured=$true;acceptingBookings=$true;sortOrder=1}
 $null=Call PUT "admin/doctors/$doctor" 204 $d $at
 $null=Call GET "doctors/$doctor" 404
 $d.isPublished=$true;$null=Call PUT "admin/doctors/$doctor" 204 $d $at
 $public=Call GET doctors 200
 if(@($public).Count-ne 1 -or $public[0].departmentName-ne 'Test Department'){throw 'Public doctor projection failed'}
 $image=Join-Path $out 'photo.png'
 [IO.File]::WriteAllBytes($image,[Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBd8AAAAASUVORK5CYII='))
 $uploaded=Invoke-WebRequest -Uri "http://localhost:5300/api/clinic/admin/doctors/$doctor/photo" -Method POST -Headers @{Authorization="Bearer $at"} -Form @{file=Get-Item -LiteralPath $image} -SkipHttpErrorCheck
 if([int]$uploaded.StatusCode-ne 204){throw 'Photo upload failed'};$count++
 $photo=Invoke-WebRequest -Uri "http://localhost:5300/api/clinic/doctors/$doctor/photo" -SkipHttpErrorCheck
 if([int]$photo.StatusCode-ne 200 -or $photo.Headers['Content-Type']-notmatch 'image/png'){throw 'Photo read failed'};$count++
 $start=[DateTimeOffset]::UtcNow.AddDays(2).Date.AddHours(2)
 $schedule=@{doctorId=$doctor;startTime=$start.ToString('yyyy-MM-ddTHH:mm:ssZ');endTime=$start.AddHours(2).ToString('yyyy-MM-ddTHH:mm:ssZ');slotMinutes=30;room='P101'}
 $created=Call POST admin/schedules 200 $schedule $at
 $null=Call POST admin/schedules 409 $schedule $at
 $null=Call PUT "admin/schedules/$($created.id)" 401 $schedule
 $null=Call PUT "admin/schedules/$($created.id)" 403 $schedule $pt
 $schedule.room='P102'
 $null=Call PUT "admin/schedules/$($created.id)" 200 $schedule $at
 $allSchedules=Call GET admin/schedules 200 $null $at
 $saved=$allSchedules | Where-Object id -eq $created.id
 if($saved.room-ne 'P102' -or $saved.totalSlots-ne 4 -or $saved.hasAppointments){throw 'Schedule update or capacity projection failed'}
 $doctor2='55555555-5555-5555-5555-555555555555'
 Sql "INSERT dbo.Users(Id,Email,PasswordHash,Role,PhoneNumber,IsActive) VALUES('$doctor2','doctor2@clinic.test','unused','Doctor','0900000005',1); INSERT dbo.DoctorProfiles(UserId,SpecialtyId) VALUES('$doctor2',1);" $testDb
 $d2=$d.Clone();$d2.fullName='Second Doctor'
 $null=Call PUT "admin/doctors/$doctor2" 204 $d2 $at
 $collision=$schedule.Clone();$collision.doctorId=$doctor2
 $null=Call POST admin/schedules 409 $collision $at
 $collision.room='P103'
 $second=Call POST admin/schedules 200 $collision $at
 $collision.room='P102'
 $null=Call PUT "admin/schedules/$($second.id)" 409 $collision $at
 $null=Call DELETE "admin/schedules/$($second.id)" 204 $null $at

 $date=$start.AddHours(7).ToString('yyyy-MM-dd')
 $slots=Call GET "doctors/$doctor/slots?date=$date" 200
 if(@($slots).Count-ne 4){throw 'Expected four 30 minute slots'}
 $null=Call POST appointments 200 @{timeSlotId=$slots[0].id;symptom='Test'} $pt
 $null=Call GET "admin/schedules/$($created.id)/appointments" 401
 $null=Call GET "admin/schedules/$($created.id)/appointments" 403 $null $pt
 $visits=Call GET "admin/schedules/$($created.id)/appointments" 200 $null $at
 if(@($visits).Count-ne 1 -or $visits[0].patientName-ne 'Test Patient'){throw 'Schedule patient details failed'}
 $null=Call PUT "admin/schedules/$($created.id)" 409 $schedule $at
 $counts=Call GET admin/schedules 200 $null $at
 $saved=$counts | Where-Object id -eq $created.id
 if($saved.booked-ne 1 -or !$saved.hasAppointments){throw 'Schedule booking count failed'}

 $null=Call POST appointments 409 @{timeSlotId=$slots[0].id} $ot
 $remaining=Call GET "doctors/$doctor/slots?date=$date" 200
 if(@($remaining).Count-ne 3){throw 'Booked slot is still available'}
 $null=Call DELETE "admin/schedules/$($created.id)" 409 $null $at
 $mine=Call GET appointments 200 $null $pt
 if(@($mine).Count-ne 1 -or $mine[0].status-ne 'Pending'){throw 'Appointment persistence failed'}
 $others=Call GET appointments 200 $null $ot
 if(@($others).Count-ne 0){throw 'Patient isolation failed'}
 $jobs=@($pt,$ot)|ForEach-Object { Start-Job -ScriptBlock {
     param($token,$slot)
     $r=Invoke-WebRequest -Uri 'http://localhost:5300/api/clinic/appointments' -Method POST -Headers @{Authorization="Bearer $token"} -ContentType 'application/json' -Body (@{timeSlotId=$slot}|ConvertTo-Json -Compress) -SkipHttpErrorCheck -TimeoutSec 20
     [int]$r.StatusCode
 } -ArgumentList $_,$slots[1].id }
 try{$statuses=@($jobs|Receive-Job -Wait -ErrorAction Stop|Sort-Object);if(($statuses-join ',')-ne '200,409'){throw "Concurrent booking failed: $statuses"};$count+=2}finally{$jobs|Remove-Job -Force}
 $schedule.startTime=$start.AddHours(3).ToString('yyyy-MM-ddTHH:mm:ssZ');$schedule.endTime=$start.AddHours(4).ToString('yyyy-MM-ddTHH:mm:ssZ')
 $free=Call POST admin/schedules 200 $schedule $at
 $null=Call DELETE "admin/schedules/$($free.id)" 204 $null $at
 $null=Call PUT "admin/schedules/$($free.id)" 409 $schedule $at
 Sql "UPDATE dbo.Appointments SET Status='Cancelled' WHERE TimeSlotId IN (SELECT Id FROM dbo.TimeSlots WHERE ScheduleId='$($created.id)');" $testDb
 $null=Call PUT "admin/schedules/$($created.id)" 409 $schedule $at
 $null=Call DELETE "admin/schedules/$($created.id)" 204 $null $at
 $history=Call GET "admin/schedules/$($created.id)/appointments" 200 $null $at
 if(@($history).Count-ne 2){throw 'Cancelled schedule lost appointment history'}

 $null=Call GET admin/schedules 200 $null $at
 $null=Call GET admin/doctors 200 $null $at
 $null=Call GET 'doctors?featured=true' 200
 $null=Call PUT "departments/$($dept.id)" 200 @{code='TEST';name='Test Department';isActive=$false} $at
 $null=Call GET "doctors/$doctor" 404
 $null=Call GET "doctors/$doctor/photo" 404
 $null=Call POST appointments 409 @{timeSlotId=$slots[2].id} $pt
 $null=Call PUT "departments/$($dept.id)" 200 @{code='TEST';name='Test Department';isActive=$true} $at
 $null=Call GET "doctors/$doctor/slots?date=invalid" 400
 $d.acceptingBookings=$false;$null=Call PUT "admin/doctors/$doctor" 204 $d $at
 $null=Call POST appointments 409 @{timeSlotId=$slots[2].id} $ot
 $d.acceptingBookings=$true;$d.isPublished=$false;$null=Call PUT "admin/doctors/$doctor" 204 $d $at
 $null=Call GET "doctors/$doctor" 404
 $empty=Call GET "doctors/$doctor/slots?date=$date" 200
 if(@($empty).Count-ne 0){throw 'Draft doctor exposes slots'}
 "PASS: $count API checks; migration is repeatable; appointment persisted; role and patient isolation verified."
}finally{
 if($process -and !$process.HasExited){Stop-Process -Id $process.Id -Force}
 Sql "IF DB_ID('$testDb') IS NOT NULL BEGIN ALTER DATABASE [$testDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$testDb]; END"
 foreach($name in @('ASPNETCORE_ENVIRONMENT','MobileDevelopment__AllowHttp','ASPNETCORE_URLS','Jwt__SigningKey','Jwt__Issuer','Jwt__Audience','ConnectionStrings__DefaultConnection')){Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue}
}

