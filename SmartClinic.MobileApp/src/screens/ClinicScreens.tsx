import { AppointmentActions } from '../components/AppointmentActions';
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileApp } from '../context/MobileAppContext';
import { loadDoctors, loadSlots, bookSlot, loadAppointments, doctorPhoto, clinicTime, type ClinicDoctor, type ClinicSlot, type ClinicAppointment } from '../api/clinic';
const message=(e:unknown)=>e instanceof Error?e.message:'Không thể tải dữ liệu.';
const today=()=>{const d=new Date(Date.now()+7*3600000);return d.toISOString().slice(0,10);};
const slotHour=(value:string)=>new Date(/(Z|[+-]\d\d:\d\d)$/.test(value)?value:value+'Z').toLocaleTimeString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'});
function Button({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}){return <TouchableOpacity disabled={disabled} style={[s.button,disabled&&{opacity:.45}]} onPress={onPress}><Text style={s.white}>{label}</Text></TouchableOpacity>;}
export function ClinicDoctorsScreen() {
 const {requestStartBooking}=useMobileApp();
 const [doctors,setDoctors]=useState<ClinicDoctor[]>([]),[selected,setSelected]=useState<ClinicDoctor|null>(null),[search,setSearch]=useState(''),[department,setDepartment]=useState<number|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
 useEffect(()=>{let live=true;setLoading(true);loadDoctors().then(d=>{if(live){setDoctors(d);setError('');}}).catch(e=>{if(live)setError(message(e));}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[revision]);
 const book=(d:ClinicDoctor)=>requestStartBooking({id:d.id,fullName:d.fullName,title:d.title??'',specialtyId:String(d.departmentId),specialtyName:d.departmentName,roomNumber:'',experienceYears:0,rating:0,reviewCount:0,avatarUrl:d.hasPhoto?doctorPhoto(d.id):'',bio:d.bio??'',availableDays:[]});
 return <ScrollView contentContainerStyle={s.page}><Text style={s.title}>Đội ngũ bác sĩ</Text>{error&&<><Text style={s.error}>{error}</Text><Button label="Thử lại" onPress={()=>setRevision(x=>x+1)}/></>}{loading?<ActivityIndicator/>:selected?<View style={s.card}><Button label="← Danh sách bác sĩ" onPress={()=>setSelected(null)}/>{selected.hasPhoto?<Image source={{uri:doctorPhoto(selected.id)}} style={s.photo}/>:<Ionicons name="person-circle-outline" size={90} color="#0084c7"/>}<Text style={s.heading}>{selected.title} {selected.fullName}</Text><Text>{selected.position} · {selected.departmentName}</Text>{(['bio','expertise','education','workHistory','certificates'] as const).map((k,i)=>selected[k]?<View key={k}><Text style={s.heading}>{['Giới thiệu','Chuyên môn','Đào tạo','Công tác','Chứng chỉ'][i]}</Text><Text style={s.body}>{selected[k]}</Text></View>:null)}<Text>Phí khám: {selected.consultationFee.toLocaleString()} đ</Text><Button disabled={!selected.acceptingBookings} label={selected.acceptingBookings?'Đặt lịch khám':'Tạm ngừng nhận lịch'} onPress={()=>book(selected)}/></View>:<><TextInput style={s.input} placeholder="Tìm tên bác sĩ" value={search} onChangeText={setSearch}/><ScrollView horizontal><TouchableOpacity style={s.chip} onPress={()=>setDepartment(null)}><Text>{department===null?'✓ ':''}Tất cả khoa</Text></TouchableOpacity>{[...new Map(doctors.map(d=>[d.departmentId,d.departmentName])).entries()].map(([id,name])=><TouchableOpacity style={s.chip} key={id} onPress={()=>setDepartment(id)}><Text>{department===id?'✓ ':''}{name}</Text></TouchableOpacity>)}</ScrollView>{doctors.filter(d=>(department===null||d.departmentId===department)&&d.fullName.toLowerCase().includes(search.toLowerCase())).map(d=><View style={s.card} key={d.id}><TouchableOpacity onPress={()=>setSelected(d)}>{d.hasPhoto?<Image source={{uri:doctorPhoto(d.id)}} style={s.photo}/>:<Ionicons name="person-circle-outline" size={75} color="#0084c7"/>}<Text style={s.heading}>{d.title} {d.fullName}</Text><Text>{d.departmentName}</Text><Text style={s.body} numberOfLines={3}>{d.position||d.bio}</Text><Text style={{color:'#0084c7'}}>Xem hồ sơ</Text></TouchableOpacity><Button disabled={!d.acceptingBookings} label={d.acceptingBookings?'Đặt lịch khám':'Tạm ngừng nhận lịch'} onPress={()=>book(d)}/></View>)}{doctors.length===0&&<Text>Chưa có hồ sơ bác sĩ được công bố.</Text>}</>}</ScrollView>;
}
export function ClinicBookingScreen() {
 const {accessToken,currentUser,openAuthModal,setActiveTab,selectedDoctorForBooking}=useMobileApp();
 const [doctors,setDoctors]=useState<ClinicDoctor[]>([]),[doctor,setDoctor]=useState(selectedDoctorForBooking?.id??''),[date,setDate]=useState(today),[slots,setSlots]=useState<ClinicSlot[]>([]),[slot,setSlot]=useState(''),[symptom,setSymptom]=useState(''),[error,setError]=useState(''),[success,setSuccess]=useState(false),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{let live=true;loadDoctors().then(d=>{if(live)setDoctors(d);}).catch(e=>{if(live)setError(message(e));});return()=>{live=false;};},[]);
 useEffect(()=>{let live=true;setSlots([]);setSlot('');setLoading(false);if(!doctor||!/^\d{4}-\d{2}-\d{2}$/.test(date))return;setLoading(true);loadSlots(doctor,date).then(d=>{if(live)setSlots(d);}).catch(e=>{if(live)setError(message(e));}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[doctor,date,revision]);
 const submit=async()=>{if(!accessToken){openAuthModal();return;}if(!currentUser.isProfileCompleted){setActiveTab('profile');return;}setBusy(true);setError('');try{await bookSlot(slot,symptom,accessToken);setSuccess(true);setRevision(x=>x+1);}catch(e){setError(message(e));setRevision(x=>x+1);}finally{setBusy(false);}};
 return <ScrollView contentContainerStyle={s.page}><Text style={s.title}>Đặt lịch khám</Text>{error&&<Text style={s.error}>{error}</Text>}{success&&<View style={s.card}><Text style={{color:'#008050'}}>Đặt lịch thành công.</Text><Button label="Xem lịch khám của tôi" onPress={()=>setActiveTab('visits')}/></View>}<Text style={s.heading}>Chọn bác sĩ theo khoa</Text>{doctors.filter(d=>d.acceptingBookings).map(d=><TouchableOpacity disabled={busy} style={[s.chip,doctor===d.id&&s.active]} key={d.id} onPress={()=>{setDoctor(d.id);setSuccess(false);}}><Text>{doctor===d.id?'✓ ':''}{d.title} {d.fullName} — {d.departmentName}</Text></TouchableOpacity>)}{doctors.length===0&&<Text>Chưa có bác sĩ nhận lịch.</Text>}<Text>Ngày khám (YYYY-MM-DD)</Text><TextInput style={s.input} value={date} onChangeText={setDate} placeholder="2026-11-20" keyboardType="numbers-and-punctuation" maxLength={10}/><Text style={s.heading}>Khung giờ trống (giờ Việt Nam)</Text>{loading?<ActivityIndicator/>:slots.length===0?<Text>Chưa có giờ trống. Vui lòng chọn bác sĩ hoặc ngày khác.</Text>:<View style={s.slotGrid}>{slots.map(t=>{
 const selected=slot===t.id;
 return <TouchableOpacity disabled={busy} key={t.id} accessibilityRole="button" accessibilityState={{selected,disabled:busy}} accessibilityLabel={`${slotHour(t.startTime)} đến ${slotHour(t.endTime)}, phòng ${t.room}`} activeOpacity={0.75} style={[s.slotCard,selected&&s.slotSelected,busy&&{opacity:.5}]} onPress={()=>setSlot(t.id)}>
   <View style={s.slotTop}><Ionicons name="time-outline" size={18} color={selected?'#0072bc':'#64748b'}/><Ionicons name={selected?'checkmark-circle':'ellipse-outline'} size={20} color={selected?'#0084c7':'#cbd5e1'}/></View>
   <Text style={[s.slotTime,selected&&{color:'#0072bc'}]}>{slotHour(t.startTime)} – {slotHour(t.endTime)}</Text>
   <View style={s.slotRoom}><Ionicons name="location-outline" size={13} color="#64748b"/><Text style={s.slotRoomText}>Phòng {t.room}</Text></View>
   <Text style={[s.slotStatus,selected&&{color:'#0072bc'}]}>{selected?'Đang chọn':'Còn trống'}</Text>
 </TouchableOpacity>;
})}</View>}<Text>Lý do khám</Text><TextInput style={s.input} multiline maxLength={2000} value={symptom} onChangeText={setSymptom}/><Button disabled={!slot||busy} label={busy?'Đang đặt lịch…':!accessToken?'Đăng nhập để đặt lịch':!currentUser.isProfileCompleted?'Hoàn thiện thông tin cá nhân':'Xác nhận đặt lịch'} onPress={()=>void submit()}/></ScrollView>;
}
export function ClinicVisitsScreen() {
 const {accessToken,openAuthModal}=useMobileApp();const [items,setItems]=useState<ClinicAppointment[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
 useEffect(()=>{let live=true;if(!accessToken){setLoading(false);setItems([]);return;}setLoading(true);loadAppointments(accessToken).then(d=>{if(live){setItems(d);setError('');}}).catch(e=>{if(live)setError(message(e));}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[accessToken,revision]);
 useEffect(()=>{if(!accessToken)return;const subscription=AppState.addEventListener('change',state=>{if(state==='active')setRevision(x=>x+1);});return()=>subscription.remove();},[accessToken]);
 const statusLabels:Record<string,string>={Pending:'Chờ xác nhận',Confirmed:'Đã xác nhận',Cancelled:'Đã hủy',Completed:'Hoàn tất',CheckedIn:'Đã tiếp nhận',InProgress:'Đang khám',NoShow:'Không đến'};
 return <ScrollView style={{flex:1}} contentContainerStyle={[s.page,{flexGrow:1}]} refreshControl={accessToken?<RefreshControl refreshing={loading} onRefresh={()=>setRevision(x=>x+1)} tintColor="#0084c7" colors={['#0084c7']}/>:undefined}>
   <View style={s.visitsHeader}><View style={{flex:1}}><Text style={s.title}>Lịch khám của tôi</Text><Text style={s.visitsSubtitle}>Theo dõi lịch hẹn và thông tin khám</Text></View>
     {accessToken&&items.length>0&&<TouchableOpacity accessibilityRole="button" accessibilityLabel="Tải lại lịch khám" disabled={loading} onPress={()=>setRevision(x=>x+1)} style={s.refreshIcon}><Ionicons name="refresh-outline" size={21} color="#0084c7"/></TouchableOpacity>}
   </View>
   {!accessToken?<Button label="Đăng nhập" onPress={()=>openAuthModal()}/>:<>
     {error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
     {loading&&items.length===0?<ActivityIndicator color="#0084c7"/>:items.length===0?<View style={{flex:1,gap:14}}><Text>Chưa có lịch hẹn.</Text><View style={{flex:1}}/><Button label="Tải lại" onPress={()=>setRevision(x=>x+1)}/></View>:items.map(a=>{
       const dateValue=new Date(/(Z|[+-]\d\d:\d\d)$/.test(a.startTime)?a.startTime:a.startTime+'Z');
       const cancelled=a.status==='Cancelled';
       return <View style={s.visitCard} key={a.id}>
         <View style={s.visitTop}><View style={s.visitDate}><Ionicons name="calendar-outline" size={17} color="#0072bc"/><Text style={s.visitDateText}>{dateValue.toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'})}</Text></View>
           <View style={[s.visitBadge,a.status==='Confirmed'&&{backgroundColor:'#ecfdf5'},cancelled&&{backgroundColor:'#fff1f2'}]}><Text style={[s.visitBadgeText,a.status==='Confirmed'&&{color:'#047857'},cancelled&&{color:'#be123c'}]}>{statusLabels[a.status]??a.status}</Text></View>
         </View>
         <View style={s.visitDoctorRow}><View style={s.visitAvatar}><Ionicons name="person-outline" size={25} color="#0084c7"/></View><View style={{flex:1,gap:5}}><Text style={s.visitDoctorName}>{a.doctorName}</Text><Text style={s.visitDepartment}>{a.departmentName||'Chưa có thông tin khoa'}</Text></View></View>
         <View style={s.visitTimeRow}><Ionicons name="time-outline" size={19} color="#0084c7"/><Text style={s.visitTimeText}>{slotHour(a.startTime)}</Text><Text style={s.visitTimeCaption}>Giờ khám · Giờ Việt Nam</Text></View>
         {!!a.symptom&&<View style={s.visitReason}><Text style={s.visitReasonLabel}>Lý do khám</Text><Text style={s.visitReasonText}>{a.symptom}</Text></View>}
         {accessToken&&<AppointmentActions appointment={a} token={accessToken} onSaved={()=>setRevision(x=>x+1)}/>}
       </View>;
     })}
   </>}
 </ScrollView>;
}
const s=StyleSheet.create({
 visitsHeader:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:4},
 visitsSubtitle:{fontSize:12,color:'#64748b',marginTop:6},
 refreshIcon:{padding:11,borderRadius:13,backgroundColor:'#e8f5fd',borderWidth:1,borderColor:'#d5eaf7'},
 visitCard:{backgroundColor:'#fff',borderRadius:20,borderWidth:1,borderColor:'#e2e8f0',padding:16,gap:16},
 visitTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10},
 visitDate:{flexDirection:'row',alignItems:'center',gap:7},
 visitDateText:{fontSize:13,fontWeight:'600',color:'#16415a'},
 visitBadge:{backgroundColor:'#fff7e6',paddingHorizontal:10,paddingVertical:6,borderRadius:20},
 visitBadgeText:{fontSize:11,fontWeight:'600',color:'#946200'},
 visitDoctorRow:{flexDirection:'row',alignItems:'center',gap:12},
 visitAvatar:{width:48,height:48,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'#eff8ff'},
 visitDoctorName:{fontSize:16,fontWeight:'700',color:'#16415a'},
 visitDepartment:{fontSize:13,color:'#64748b'},
 visitTimeRow:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8,padding:12,borderRadius:12,backgroundColor:'#f1f8fc'},
 visitTimeText:{fontSize:19,fontWeight:'700',color:'#0072bc'},
 visitTimeCaption:{fontSize:11,color:'#64748b'},
 visitReason:{borderTopWidth:1,borderTopColor:'#f1f5f9',paddingTop:12,gap:5},
 visitReasonLabel:{fontSize:11,fontWeight:'600',color:'#64748b'},
 visitReasonText:{fontSize:13,color:'#334155',lineHeight:20},

 slotGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},
 slotCard:{width:'48%',flexGrow:1,flexBasis:'45%',borderWidth:1,borderColor:'#e2e8f0',borderRadius:16,padding:14,backgroundColor:'#ffffff',gap:9},
 slotSelected:{borderColor:'#0084c7',backgroundColor:'#eaf7ff'},
 slotTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 slotTime:{fontSize:16,fontWeight:'700',color:'#16415a'},
 slotRoom:{flexDirection:'row',alignItems:'center',gap:4},
 slotRoomText:{fontSize:12,color:'#64748b',flexShrink:1},
 slotStatus:{fontSize:11,fontWeight:'600',color:'#16805d'},
page:{padding:18,gap:14,paddingBottom:90},title:{fontSize:23,fontWeight:'700',color:'#0084c7'},heading:{fontSize:16,fontWeight:'700',marginVertical:8,color:'#16415a'},body:{lineHeight:22},card:{backgroundColor:'white',padding:18,borderRadius:16,borderWidth:1,borderColor:'#e2e8f0',gap:10},input:{borderWidth:1,borderColor:'#dbe5ee',backgroundColor:'#f8fafc',padding:14,borderRadius:12},button:{backgroundColor:'#0084c7',padding:14,borderRadius:12,alignItems:'center'},white:{color:'white',fontWeight:'700'},error:{color:'#dc2626'},photo:{width:'100%',height:260,borderRadius:12,resizeMode:'cover'},chip:{padding:12,borderWidth:1,borderColor:'#dbe5ee',borderRadius:10,marginRight:8,marginVertical:4},active:{backgroundColor:'#e0f2fe',borderColor:'#0084c7'}});
