import { getArticle } from '../api/articles';
import { HeaderBar } from '../components/HeaderBar';
import { API_URL } from '../api/client';
import React, { useState, useRef } from 'react';
import {
  ScrollView,
  ActivityIndicator,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useMobileApp } from '../context/MobileAppContext';
import { Specialty, HospitalArticle } from '../types';

export const HomeScreen: React.FC = () => {
  const {
    specialties,
    doctors,
    articles, articlesLoading, articlesError, articlesHasMore, loadArticles,
    requestStartBooking,
    setActiveTab,
  } = useMobileApp();

  // Trạng thái phóng to / thu nhỏ chuyên khoa ngay tại Trang chủ (giống hệt Web)
  const [expandedSpecialty, setExpandedSpecialty] = useState<Specialty | null>(null);

  // Modal đọc chi tiết bài báo Tin tức hoạt động
  const [selectedArticle, setSelectedArticle] = useState<HospitalArticle | null>(null);

  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState('');
  const detailRequest = useRef(0);
  const openArticle = async (article: HospitalArticle) => {
    const version = ++detailRequest.current;
    setSelectedArticle(article); setArticleLoading(true); setArticleError('');
    try { const detail = await getArticle(article.id); if (version === detailRequest.current) setSelectedArticle(detail); }
    catch (error) { if (version === detailRequest.current) setArticleError(error instanceof Error ? error.message : 'Không tải được bài viết.'); }
    finally { if (version === detailRequest.current) setArticleLoading(false); }
  };
  const closeArticle = () => { detailRequest.current++; setSelectedArticle(null); setArticleLoading(false); };

  // Modal xem Video giới thiệu bệnh viện
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <HeaderBar />
      {/* =========================================================================
          1. HERO BANNER & OCEAN BLUE HOTLINE BOX (Đồng bộ Web Screenshot 1)
      ========================================================================= */}
      <View style={styles.heroCard}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=900&q=80',
          }}
          style={styles.heroImage}
        />

        <View style={styles.heroContent}>
          <Text style={styles.heroHeadline}>
            CHĂM SÓC SỨC KHỎE{'\n'}BẢN THÂN & GIA ĐÌNH BẠN
          </Text>

          {/* Khung Hotline Xanh Dương Bo Tròn (#0084c7) */}
          <View style={styles.hotlineBox}>
            <View style={styles.hotlineTopRow}>
              <Ionicons name="call" size={20} color={COLORS.white} />
              <Text style={styles.hotlineMainNumber}>(024) 3 577 3888</Text>
            </View>

            <View style={styles.hotlineLineItem}>
              <Text style={styles.hotlineLabel}>KHÁM YÊU CẦU:</Text>
              <Text style={[styles.hotlineValue, { color: '#fde68a' }]}>0963 580 006</Text>
            </View>
            <View style={styles.hotlineLineItem}>
              <Text style={styles.hotlineLabel}>KHÁM THƯỜNG & BHYT:</Text>
              <Text style={styles.hotlineValue}>0962 535 329</Text>
            </View>
            <View style={styles.hotlineLineItem}>
              <Text style={styles.hotlineLabel}>PHÒNG TIÊM CHỦNG:</Text>
              <Text style={styles.hotlineValue}>0985 827 961</Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={15} color={COLORS.rose} />
            <Text style={styles.addressText}>124 Vũ Trọng Phụng, Thanh Xuân, Hà Nội</Text>
          </View>
        </View>
      </View>

      {/* =========================================================================
          2. 6 NÚT TRÒN THAO TÁC NHANH (PASTEL QUICK ACTION BADGES)
      ========================================================================= */}
      <View style={styles.quickBadgesSection}>
        <View style={styles.quickBadgesGrid}>
          {/* 1. Đặt lịch khám */}
          <TouchableOpacity
            style={styles.quickBadgeItem}
            onPress={() => requestStartBooking()}
            activeOpacity={0.8}
          >
            <View style={[styles.quickCircle, { backgroundColor: COLORS.badgeBookingBg }]}>
              <Ionicons name="chatbubbles" size={24} color={COLORS.badgeBookingIcon} />
            </View>
            <Text style={styles.quickBadgeLabel}>Đặt lịch khám</Text>
          </TouchableOpacity>

          {/* 2. Quy trình khám */}
          <TouchableOpacity
            style={styles.quickBadgeItem}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <View style={[styles.quickCircle, { backgroundColor: COLORS.badgeProcessBg }]}>
              <Ionicons name="add-circle" size={24} color={COLORS.badgeProcessIcon} />
            </View>
            <Text style={styles.quickBadgeLabel}>Quy trình khám</Text>
          </TouchableOpacity>

          {/* 3. Lịch khám */}
          <TouchableOpacity
            style={styles.quickBadgeItem}
            onPress={() => setActiveTab('visits')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickCircle, { backgroundColor: COLORS.badgeScheduleBg }]}>
              <Ionicons name="calendar" size={24} color={COLORS.badgeScheduleIcon} />
            </View>
            <Text style={styles.quickBadgeLabel}>Lịch khám</Text>
          </TouchableOpacity>

          {/* 4. Bảng giá dịch vụ kỹ thuật */}
          <TouchableOpacity
            style={styles.quickBadgeItem}
            onPress={() => setActiveTab('pricing')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickCircle, { backgroundColor: COLORS.badgePricingBg }]}>
              <Ionicons name="document-text" size={24} color={COLORS.badgePricingIcon} />
            </View>
            <Text style={styles.quickBadgeLabel}>Bảng giá dịch vụ</Text>
          </TouchableOpacity>

          {/* 5. Tìm bác sĩ */}
          <TouchableOpacity
            style={styles.quickBadgeItem}
            onPress={() => setActiveTab('doctors')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickCircle, { backgroundColor: COLORS.badgeDoctorsBg }]}>
              <Ionicons name="people" size={24} color={COLORS.badgeDoctorsIcon} />
            </View>
            <Text style={styles.quickBadgeLabel}>Tìm bác sĩ</Text>
          </TouchableOpacity>

          {/* 6. Địa điểm */}
          <TouchableOpacity
            style={styles.quickBadgeItem}
            onPress={() => setIsVideoModalOpen(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickCircle, { backgroundColor: COLORS.badgeLocationBg }]}>
              <Ionicons name="location" size={24} color={COLORS.badgeLocationIcon} />
            </View>
            <Text style={styles.quickBadgeLabel}>Địa điểm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =========================================================================
          3. GIỚI THIỆU BỆNH VIỆN & VIDEO PHIM TÀI LIỆU
      ========================================================================= */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>BỆNH VIỆN ĐA KHOA QUỐC TẾ PHÚC AN</Text>
        <Text style={styles.aboutSub}>ĐỊA CHỈ TIN CẬY CHO NGƯỜI BỆNH VIỆT NAM</Text>
        <Text style={styles.aboutDesc}>
          Bệnh viện Đa khoa Quốc tế Phúc An là cơ sở y tế chuyên sâu hàng đầu trong hệ thống thăm khám,
          điều trị và tầm soát sức khỏe toàn diện. Đội ngũ Giáo sư, Tiến sĩ, Bác sĩ đầu ngành trực tiếp thăm khám.
        </Text>

        <TouchableOpacity
          style={styles.videoCard}
          onPress={() => setIsVideoModalOpen(true)}
          activeOpacity={0.88}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
            }}
            style={styles.videoThumb}
          />
          <View style={styles.videoOverlay}>
            <View style={styles.playBtnCircle}>
              <Ionicons name="play" size={26} color={COLORS.white} />
            </View>
            <Text style={styles.videoCaption}>
              Xem phim giới thiệu Bệnh viện Đa khoa Quốc tế Phúc An
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* =========================================================================
          4. HAI BANNER CHIẾN DỊCH NỔI BẬT (TẦM SOÁT TIM MẠCH & ĐẶT LỊCH ONLINE)
      ========================================================================= */}
      <View style={styles.promoSection}>
        {/* Banner 1: Tầm soát tim mạch */}
        <View style={styles.promoCardLight}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTag}>BỆNH VIỆN ĐA KHOA QUỐC TẾ PHÚC AN</Text>
            <Text style={styles.promoTitleBlue}>TẦM SOÁT TIM MẠCH</Text>
            <Text style={styles.promoHotline}>Hotline: 024 35764558</Text>
            <TouchableOpacity
              style={styles.promoActionBlue}
              onPress={() => requestStartBooking()}
            >
              <Text style={styles.promoActionBlueText}>Đăng ký gói khám →</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80',
            }}
            style={styles.promoThumb}
          />
        </View>

        {/* Banner 2: Đặt lịch online ưu tiên khám trước */}
        <View style={styles.promoCardBlue}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitleWhite}>
              ĐẶT LỊCH ONLINE{'\n'}ƯU TIÊN KHÁM TRƯỚC
            </Text>
            <Text style={styles.promoDescWhite}>
              Chủ động chọn giờ khám, giảm thiểu tối đa thời gian chờ đợi tại viện.
            </Text>
            <TouchableOpacity
              style={styles.promoActionWhite}
              onPress={() => requestStartBooking()}
            >
              <Ionicons name="calendar" size={14} color={COLORS.primary} />
              <Text style={styles.promoActionWhiteText}>ĐẶT LỊCH KHÁM</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
            }}
            style={[styles.promoThumb, { borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }]}
          />
        </View>
      </View>

      {/* =========================================================================
          5. TIN TỨC HOẠT ĐỘNG (Đặt phía trên Danh mục kỹ thuật theo đúng bố cục Web)
      ========================================================================= */}
      <View style={styles.sectionBlock}>
        <View style={styles.pillHeaderWrap}>
          <View style={styles.cyanPillBadge}>
            <Text style={styles.cyanPillText}>TIN TỨC HOẠT ĐỘNG</Text>
          </View>
        </View>

        {articlesLoading && <ActivityIndicator color={COLORS.primary} />}
          {!!articlesError && <View><Text style={{ color: '#b91c1c' }}>{articlesError}</Text><TouchableOpacity onPress={() => void loadArticles(articles.length === 0)}><Text style={{ padding: 12 }}>Thử lại</Text></TouchableOpacity></View>}
          {!articlesLoading && !articlesError && articles.length === 0 && <Text>Chưa có bài viết được công bố.</Text>}
          {articlesHasMore && <TouchableOpacity disabled={articlesLoading} onPress={() => void loadArticles()}><Text style={{ padding: 12, color: COLORS.primary }}>Tải thêm bài viết</Text></TouchableOpacity>}
          {articles.map((art) => (
          <TouchableOpacity
            key={art.id}
            style={styles.newsCard}
            onPress={() => void openArticle(art)}
            activeOpacity={0.85}
          >
            {!!art.image && <Image source={{ uri: art.image }} style={styles.newsImage} />}
            <View style={styles.newsBody}>
              <Text style={styles.newsMeta}>
                {art.category} • {art.date}
              </Text>
              <Text style={styles.newsTitle} numberOfLines={2}>
                {art.title}
              </Text>
              <Text style={styles.newsSummary} numberOfLines={2}>
                {art.summary}
              </Text>
              <View style={styles.newsFooterRow}>
                <Text style={styles.newsReadMore}>Xem chi tiết bài báo</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* =========================================================================
          6. DANH MỤC KỸ THUẬT & CHUYÊN KHOA (Phóng to / Thu nhỏ ngay tại Trang chủ)
      ========================================================================= */}
      <View style={styles.sectionBlock}>
        <View style={styles.pillHeaderWrap}>
          <View style={styles.cyanPillBadge}>
            <Text style={styles.cyanPillText}>DANH MỤC KỸ THUẬT</Text>
          </View>
        </View>

        {expandedSpecialty ? (
          /* TRƯỜNG HỢP 1: KHUNG CHUYÊN KHOA ĐANG PHÓNG TO TẠI TRANG CHỦ */
          <View style={styles.expandedSpecContainer}>
            <View style={styles.expandedTopBar}>
              <TouchableOpacity
                style={styles.shrinkBackBtn}
                onPress={() => setExpandedSpecialty(null)}
              >
                <Ionicons name="arrow-back" size={15} color={COLORS.primary} />
                <Text style={styles.shrinkBackBtnText}>Thu nhỏ & Trở về danh mục kỹ thuật</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeRoundBtn}
                onPress={() => setExpandedSpecialty(null)}
              >
                <Ionicons name="close" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Banner thông tin chuyên khoa */}
            <View style={styles.expandedBanner}>
              <Text style={styles.expandedCode}>MÃ CHUYÊN KHOA: {expandedSpecialty.code}</Text>
              <Text style={styles.expandedName}>{expandedSpecialty.name}</Text>
              <Text style={styles.expandedDesc}>{expandedSpecialty.description}</Text>

              <View style={styles.highlightWrap}>
                {expandedSpecialty.highlightPoints.map((pt, idx) => (
                  <View key={idx} style={styles.highlightTag}>
                    <Text style={styles.highlightTagText}>✓ {pt}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.feeActionRow}>
                <View>
                  <Text style={styles.feeSmallLabel}>Phí khám ban đầu</Text>
                  <Text style={styles.feeAmount}>
                    {expandedSpecialty.consultationFee.toLocaleString('vi-VN')} đ
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.bookDeptBtn}
                  onPress={() => requestStartBooking()}
                >
                  <Text style={styles.bookDeptBtnText}>Đặt lịch khám tại khoa</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Đội ngũ Bác sĩ thuộc chuyên khoa */}
            <Text style={styles.deptDoctorsHeading}>
              Đội ngũ Bác sĩ trong {expandedSpecialty.name}
            </Text>

            {(() => {
              const deptDocs = doctors.filter((d) => d.specialtyId === expandedSpecialty.id);
              const list = deptDocs.length > 0 ? deptDocs : [doctors[0]];
              return list.map((doc) => (
                <View key={doc.id} style={styles.deptDocCard}>
                  <View style={styles.deptDocRow}>
                    <Image source={{ uri: doc.avatarUrl }} style={styles.deptDocAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deptDocTitleBadge}>{doc.title}</Text>
                      <Text style={styles.deptDocName}>{doc.fullName}</Text>
                      <Text style={styles.deptDocRoom}>{doc.roomNumber}</Text>
                    </View>
                  </View>
                  <Text style={styles.deptDocBio} numberOfLines={2}>
                    {doc.bio}
                  </Text>
                  <TouchableOpacity
                    style={styles.deptDocBookBtn}
                    onPress={() => requestStartBooking(doc)}
                  >
                    <Text style={styles.deptDocBookBtnText}>Đặt lịch với BS này</Text>
                  </TouchableOpacity>
                </View>
              ));
            })()}

            <TouchableOpacity
              style={styles.bottomShrinkBtn}
              onPress={() => setExpandedSpecialty(null)}
            >
              <Text style={styles.bottomShrinkBtnText}>← Thu nhỏ khung chuyên khoa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* TRƯỜNG HỢP 2: LƯỚI DANH MỤC KỸ THUẬT & CHUYÊN KHOA */
          <View style={styles.specGrid}>
            {specialties.map((spec) => (
              <TouchableOpacity
                key={spec.id}
                style={styles.specCard}
                onPress={() => setExpandedSpecialty(spec)}
                activeOpacity={0.85}
              >
                <View style={styles.specIconBox}>
                  <Ionicons name="heart-circle" size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.specName}>{spec.name}</Text>
                <Text style={styles.specDesc} numberOfLines={2}>
                  {spec.description}
                </Text>
                <View style={styles.specFooter}>
                  <Text style={styles.specPrice}>
                    {spec.consultationFee.toLocaleString('vi-VN')} đ
                  </Text>
                  <Text style={styles.specDetailLink}>Xem chi tiết ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* =========================================================================
          7. QUY TRÌNH KHÁM BỆNH 5 BƯỚC CHUẨN BỘ Y TẾ
      ========================================================================= */}
      <View style={styles.stepsSection}>
        <Text style={styles.stepsSmallTitle}>CHỈ DẪN NGƯỜI BỆNH</Text>
        <Text style={styles.stepsMainTitle}>Quy Trình Khám Bệnh 5 Bước</Text>

        {[
          { num: '01', title: 'Tiếp đón & Lấy số', desc: 'Quét mã QR đặt lịch hẹn hoặc lấy số thứ tự tự động.' },
          { num: '02', title: 'Khám lâm sàng', desc: 'Bác sĩ chuyên khoa trực tiếp khám bệnh tại phòng khám.' },
          { num: '03', title: 'Cận lâm sàng', desc: 'Xét nghiệm, siêu âm, chụp X-quang theo chỉ định.' },
          { num: '04', title: 'Kết luận & Kê đơn', desc: 'Bác sĩ kết luận, giải thích và kê đơn thuốc EMR.' },
          { num: '05', title: 'Lĩnh thuốc & Ra về', desc: 'Thanh toán BHYT, nhận thuốc tại quầy dược bệnh viện.' },
        ].map((step) => (
          <View key={step.num} style={styles.stepRowCard}>
            <View style={styles.stepNumBadge}>
              <Text style={styles.stepNumText}>{step.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* MODAL ĐỌC CHI TIẾT BÀI BÁO TIN TỨC */}
      <Modal
        visible={Boolean(selectedArticle)}
        transparent
        animationType="slide"
        onRequestClose={closeArticle}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedArticle && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {!!selectedArticle.image && <Image source={{ uri: selectedArticle.image }} style={styles.modalArticleImg} />}
                <View style={{ padding: 16 }}>
                  <Text style={styles.newsMeta}>
                    {selectedArticle.category} • {selectedArticle.date}
                  </Text>
                  <Text style={styles.modalArticleTitle}>{selectedArticle.title}</Text>
                  <Text style={styles.modalArticleSummary}>{selectedArticle.summary}</Text>
                  {articleLoading && <ActivityIndicator color={COLORS.primary} />}
                  {!!articleError && <View><Text style={{ color: '#b91c1c' }}>{articleError}</Text><TouchableOpacity onPress={() => void openArticle(selectedArticle)}><Text style={{ padding: 12 }}>Thử tải lại bài viết</Text></TouchableOpacity></View>}
                  {selectedArticle.content.map((part, idx) => {
                    const image = /^\[\[image:([a-f0-9]{32})\]\]$/i.exec(part);
                    return image ? <Image key={idx} source={{ uri: API_URL + '/api/articles/' + encodeURIComponent(selectedArticle.id) + '/images/' + image[1] }} style={{ width: '100%', height: 220, marginVertical: 12 }} resizeMode="contain" /> : <Text key={idx} style={styles.modalArticleParagraph}>{part}</Text>;
                  })}
                  <TouchableOpacity
                    style={styles.closeModalBtn}
                    onPress={closeArticle}
                  >
                    <Text style={styles.closeModalBtnText}>Đóng bài viết</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL XEM VIDEO GIỚI THIỆU */}
      <Modal
        visible={isVideoModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVideoModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { padding: 20, alignItems: 'center' }]}>
            <Ionicons name="videocam" size={44} color={COLORS.primary} />
            <Text style={[styles.modalArticleTitle, { textAlign: 'center', marginTop: 10 }]}>
              Phim Giới Thiệu Bệnh Viện Đa Khoa Quốc Tế Phúc An
            </Text>
            <Text style={[styles.modalArticleParagraph, { textAlign: 'center' }]}>
              Hệ thống chuyên khoa mũi nhọn, trang thiết bị chẩn đoán hình ảnh thế hệ mới và đội ngũ Giáo sư, Bác sĩ tận tâm.
            </Text>
            <TouchableOpacity
              style={[styles.closeModalBtn, { width: '100%' }]}
              onPress={() => setIsVideoModalOpen(false)}
            >
              <Text style={styles.closeModalBtnText}>Đóng video</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  heroImage: {
    width: '100%',
    height: 185,
  },
  heroContent: {
    padding: 16,
    alignItems: 'center',
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  hotlineBox: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0073ae',
  },
  hotlineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  hotlineMainNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
  },
  hotlineLineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  hotlineLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  hotlineValue: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.white,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  quickBadgesSection: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  quickBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  quickBadgeItem: {
    width: '31%',
    alignItems: 'center',
  },
  quickCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMain,
    textAlign: 'center',
  },
  aboutSection: {
    backgroundColor: COLORS.background,
    padding: 16,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  aboutSub: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
    marginBottom: 8,
  },
  aboutDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  videoCard: {
    width: '100%',
    height: 170,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  playBtnCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCaption: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  promoSection: {
    paddingHorizontal: 14,
    paddingTop: 16,
    gap: 12,
  },
  promoCardLight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  promoTag: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  promoTitleBlue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginVertical: 2,
  },
  promoHotline: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  promoActionBlue: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  promoActionBlueText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  promoThumb: {
    width: 105,
    height: 95,
    borderRadius: 12,
  },
  promoCardBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  promoTitleWhite: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 21,
  },
  promoDescWhite: {
    fontSize: 11,
    color: '#e0f2fe',
    marginVertical: 6,
  },
  promoActionWhite: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  promoActionWhiteText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  sectionBlock: {
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  pillHeaderWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  cyanPillBadge: {
    backgroundColor: COLORS.cyanPill,
    paddingHorizontal: 28,
    paddingVertical: 9,
    borderRadius: 24,
  },
  cyanPillText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  newsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  newsImage: {
    width: '100%',
    height: 150,
  },
  newsBody: {
    padding: 12,
  },
  newsMeta: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textMain,
    marginTop: 4,
    lineHeight: 19,
  },
  newsSummary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  newsFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  newsReadMore: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  specCard: {
    width: '48.5%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    justifyContent: 'space-between',
  },
  specIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoftBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  specName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  specDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 15,
  },
  specFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  specDetailLink: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  expandedSpecContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 14,
  },
  expandedTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  shrinkBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySoftBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  shrinkBackBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  closeRoundBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  expandedCode: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fde68a',
  },
  expandedName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    marginVertical: 4,
  },
  expandedDesc: {
    fontSize: 12,
    color: '#e0f2fe',
    lineHeight: 17,
  },
  highlightWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  highlightTag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  highlightTagText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
  },
  feeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  feeSmallLabel: {
    fontSize: 10,
    color: '#e0f2fe',
  },
  feeAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#fde68a',
  },
  bookDeptBtn: {
    backgroundColor: COLORS.amber,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  bookDeptBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textMain,
  },
  deptDoctorsHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 10,
  },
  deptDocCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 10,
  },
  deptDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  deptDocAvatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  deptDocTitleBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  deptDocName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  deptDocRoom: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  deptDocBio: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  deptDocBookBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  deptDocBookBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  bottomShrinkBtn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bottomShrinkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stepsSection: {
    marginTop: 22,
    backgroundColor: COLORS.background,
    padding: 16,
    paddingBottom: 28,
  },
  stepsSmallTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  stepsMainTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  stepNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoftBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  stepDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalArticleImg: {
    width: '100%',
    height: 180,
  },
  modalArticleTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textMain,
    marginVertical: 6,
  },
  modalArticleSummary: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 8,
    lineHeight: 18,
  },
  modalArticleParagraph: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  closeModalBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
