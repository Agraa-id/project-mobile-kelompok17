import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const colors = {
  green: '#14564A',
  deep: '#123B35',
  lime: '#D7F36A',
  coral: '#F27456',
  paper: '#F8F7F0',
  ink: '#18231F',
  muted: '#7C8981',
  line: '#DDE3D9',
  white: '#FFFFFF',
  gold: '#C58A2A',
};

const sports = ['Semua', 'Futsal', 'Badminton', 'Basket'];

const venues = [
  {
    id: 'urban-futsal',
    name: 'Urban Futsal Kemang',
    sport: 'Futsal',
    location: 'Kemang, Jakarta Selatan',
    price: 'Rp180.000',
    rating: '4.8',
    surface: 'Vinyl indoor',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'cempaka-badminton',
    name: 'Cempaka Badminton Hall',
    sport: 'Badminton',
    location: 'Cilandak, Jakarta Selatan',
    price: 'Rp75.000',
    rating: '4.7',
    surface: 'Karpet sintetis',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'northside-basket',
    name: 'Northside Basket Court',
    sport: 'Basket',
    location: 'Pondok Indah, Jakarta Selatan',
    price: 'Rp220.000',
    rating: '4.9',
    surface: 'Indoor hardwood',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80',
  },
];

export default function HomeScreen({ user, isGuest, onSignIn, onSignOut }) {
  const [activeTab, setActiveTab] = useState('explore');
  const [activeSport, setActiveSport] = useState('Semua');
  const [query, setQuery] = useState('');
  const displayName = isGuest ? 'Pemain' : user.name.split(' ')[0];
  const filteredVenues = venues.filter((venue) => {
    const matchesSport = activeSport === 'Semua' || venue.sport === activeSport;
    const searchText = `${venue.name} ${venue.sport} ${venue.location}`.toLowerCase();
    return matchesSport && searchText.includes(query.trim().toLowerCase());
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      {activeTab === 'explore' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Brand />
            <View style={styles.headerSpacer} />
            <View style={styles.location}>
              <Text style={styles.locationLabel}>LOKASI</Text>
              <Text style={styles.locationValue}>JAKARTA SELATAN</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buka akun"
              onPress={() => setActiveTab('account')}
              style={styles.headerAvatar}
            >
              <Text style={styles.headerAvatarText}>{isGuest ? 'T' : user.name.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>

          <View style={styles.intro}>
            <Text style={styles.eyebrow}>TEMUKAN TEMPAT MAIN</Text>
            <Text style={styles.title}>Halo, {displayName}.</Text>
            <Text style={styles.subtitle}>Mau main apa hari ini?</Text>
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchMark}>⌕</Text>
            <TextInput
              accessibilityLabel="Cari lapangan"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Cari nama lapangan atau area"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              autoCorrect={false}
            />
            {!!query && (
              <Pressable accessibilityRole="button" onPress={() => setQuery('')}>
                <Text style={styles.clearSearch}>Hapus</Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportTabs}
          >
            {sports.map((sport) => (
              <Pressable
                key={sport}
                accessibilityRole="button"
                accessibilityState={{ selected: activeSport === sport }}
                onPress={() => setActiveSport(sport)}
                style={[styles.sportTab, activeSport === sport && styles.sportTabActive]}
              >
                <Text style={[styles.sportTabText, activeSport === sport && styles.sportTabTextActive]}>
                  {sport}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.locationBand}>
            <View style={styles.locationBandCopy}>
              <Text style={styles.bandEyebrow}>SEKITAR KAMU</Text>
              <Text style={styles.bandTitle}>Pilih lapangan.{ '\n' }Atur waktu main.</Text>
              <Text style={styles.bandCaption}>Cari venue yang cocok untuk timmu.</Text>
            </View>
            <View style={styles.courtGraphic}>
              <View style={styles.courtHalfLine} />
              <View style={styles.courtCenterCircle} />
              <View style={styles.courtGoalLeft} />
              <View style={styles.courtGoalRight} />
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>Lapangan pilihan</Text>
              <Text style={styles.sectionCaption}>Katalog contoh untuk Jakarta Selatan</Text>
            </View>
            <Text style={styles.resultCount}>{filteredVenues.length.toString().padStart(2, '0')}</Text>
          </View>

          {filteredVenues.length > 0 ? filteredVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          )) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Lapangan tidak ditemukan</Text>
              <Text style={styles.emptyCaption}>Coba kata kunci atau kategori olahraga lain.</Text>
            </View>
          )}

          <Text style={styles.demoNotice}>Data venue dan harga pada layar ini masih contoh.</Text>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.accountContent}>
          <View style={styles.accountHeader}>
            <Brand />
            <View style={styles.headerSpacer} />
            <Pressable accessibilityRole="button" onPress={() => setActiveTab('explore')}>
              <Text style={styles.backToExplore}>Jelajah</Text>
            </Pressable>
          </View>
          <Text style={styles.eyebrow}>PROFIL</Text>
          <Text style={styles.accountTitle}>Akun</Text>
          <View style={styles.accountPanel}>
            <View style={styles.profileRow}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{isGuest ? 'T' : user.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.profileIdentity}>
                <Text style={styles.profileName}>{isGuest ? 'Tamu' : user.name}</Text>
                <Text style={styles.profileEmail}>{isGuest ? 'Jelajah tanpa akun' : user.email}</Text>
              </View>
            </View>
            <View style={styles.accountDivider} />
            <Text style={styles.accountDescription}>
              {isGuest
                ? 'Kamu bisa mencari dan melihat katalog sebagai tamu. Masuk untuk memakai akun Supabase.'
                : 'Akunmu terhubung ke Supabase. Sesi login disimpan aman di perangkat.'}
            </Text>
            {!isGuest && (
              <View style={styles.accountStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusLabel}>TERHUBUNG</Text>
                <Text style={styles.statusStorage}>SECURE SESSION</Text>
              </View>
            )}
          </View>
          {isGuest ? (
            <Pressable accessibilityRole="button" onPress={onSignIn} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Masuk atau daftar</Text>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={onSignOut} style={styles.signOutButton}>
              <Text style={styles.signOutText}>Keluar dari akun</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      <View style={styles.bottomTabs}>
        <TabButton label="Jelajah" active={activeTab === 'explore'} onPress={() => setActiveTab('explore')} />
        <TabButton label="Akun" active={activeTab === 'account'} onPress={() => setActiveTab('account')} />
      </View>
    </View>
  );
}

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>L</Text></View>
      <Text style={styles.brandName}>LAPANGAN</Text>
    </View>
  );
}

function VenueCard({ venue }) {
  return (
    <View style={styles.venueCard}>
      <View style={styles.imageFrame}>
        <Image
          accessibilityLabel={`Foto ${venue.sport.toLowerCase()} di ${venue.name}`}
          source={venue.image}
          style={styles.venueImage}
          contentFit="cover"
          cachePolicy="disk"
          transition={180}
        />
        <View style={styles.sportBadge}><Text style={styles.sportBadgeText}>{venue.sport.toUpperCase()}</Text></View>
        <Text style={styles.ratingBadge}><Text style={styles.ratingStar}>★</Text> {venue.rating}</Text>
      </View>
      <View style={styles.venueDetails}>
        <View style={styles.venueTitleRow}>
          <View style={styles.venueTitleCopy}>
            <Text style={styles.venueName}>{venue.name}</Text>
            <Text style={styles.venueLocation}>{venue.location}</Text>
          </View>
          <Text style={styles.venueArrow}>›</Text>
        </View>
        <View style={styles.venueMetaRow}>
          <Text style={styles.surfaceLabel}>{venue.surface}</Text>
          <View style={styles.priceCopy}>
            <Text style={styles.venuePrice}>{venue.price}</Text>
            <Text style={styles.priceUnit}> / jam</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.tabButton}
    >
      <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  scrollContent: { paddingBottom: 24 },
  header: {
    minHeight: 72,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    width: 31,
    height: 31,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-5deg' }],
  },
  brandMarkText: { color: colors.lime, fontSize: 18, fontWeight: '900' },
  brandName: { marginLeft: 10, color: colors.deep, fontSize: 12, fontWeight: '900', letterSpacing: 1.3 },
  headerSpacer: { flex: 1 },
  location: { alignItems: 'flex-end', marginRight: 13 },
  locationLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  locationValue: { marginTop: 3, color: colors.deep, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: colors.deep, fontSize: 14, fontWeight: '900' },
  intro: { paddingHorizontal: 22, paddingTop: 25, paddingBottom: 17 },
  eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { marginTop: 8, color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '900' },
  subtitle: { marginTop: 4, color: colors.muted, fontSize: 14 },
  searchBox: {
    minHeight: 48,
    marginHorizontal: 22,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 5,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchMark: { width: 25, color: colors.green, fontSize: 24, lineHeight: 28 },
  searchInput: { flex: 1, minHeight: 46, color: colors.ink, fontSize: 13 },
  clearSearch: { paddingLeft: 7, color: colors.green, fontSize: 11, fontWeight: '800' },
  sportTabs: { paddingHorizontal: 22, paddingTop: 17, paddingBottom: 14, gap: 22 },
  sportTab: { minHeight: 31, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  sportTabActive: { borderBottomColor: colors.coral },
  sportTabText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  sportTabTextActive: { color: colors.deep, fontWeight: '900' },
  locationBand: {
    minHeight: 151,
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  locationBandCopy: { flex: 1, zIndex: 1 },
  bandEyebrow: { color: colors.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  bandTitle: { marginTop: 7, color: colors.white, fontSize: 20, lineHeight: 23, fontWeight: '900' },
  bandCaption: { marginTop: 6, color: '#D3E3DA', fontSize: 10 },
  courtGraphic: {
    width: 100,
    height: 73,
    marginLeft: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  courtHalfLine: { position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.42)' },
  courtCenterCircle: { position: 'absolute', width: 30, height: 30, left: 34, top: 21, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)' },
  courtGoalLeft: { position: 'absolute', width: 10, height: 28, left: 0, top: 22, borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.42)' },
  courtGoalRight: { position: 'absolute', width: 10, height: 28, right: 0, top: 22, borderLeftWidth: 1, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.42)' },
  sectionHeading: { paddingHorizontal: 22, paddingTop: 23, paddingBottom: 13, flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  sectionCaption: { marginTop: 4, color: colors.muted, fontSize: 10 },
  resultCount: { marginLeft: 'auto', color: colors.green, fontSize: 14, fontWeight: '900' },
  venueCard: { marginHorizontal: 22, marginBottom: 14, borderRadius: 5, backgroundColor: colors.white, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  imageFrame: { height: 156, backgroundColor: '#D7E2D9' },
  venueImage: { width: '100%', height: '100%', backgroundColor: '#D7E2D9' },
  sportBadge: { position: 'absolute', left: 12, top: 12, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 3, backgroundColor: colors.lime },
  sportBadgeText: { color: colors.deep, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  ratingBadge: { position: 'absolute', right: 12, top: 12, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 3, backgroundColor: colors.white, color: colors.ink, fontSize: 10, fontWeight: '800' },
  ratingStar: { color: colors.gold },
  venueDetails: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 13 },
  venueTitleRow: { flexDirection: 'row', alignItems: 'center' },
  venueTitleCopy: { flex: 1 },
  venueName: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  venueLocation: { marginTop: 4, color: colors.muted, fontSize: 11 },
  venueArrow: { marginLeft: 8, color: colors.green, fontSize: 25, lineHeight: 26 },
  venueMetaRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'center' },
  surfaceLabel: { color: colors.muted, fontSize: 10 },
  priceCopy: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'baseline' },
  venuePrice: { color: colors.deep, fontSize: 12, fontWeight: '900' },
  priceUnit: { color: colors.muted, fontSize: 10 },
  emptyState: { marginHorizontal: 22, paddingVertical: 35, alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white },
  emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  emptyCaption: { marginTop: 6, color: colors.muted, fontSize: 11 },
  demoNotice: { marginHorizontal: 22, marginTop: 1, color: colors.muted, fontSize: 10, textAlign: 'center' },
  accountContent: { flexGrow: 1, paddingBottom: 25 },
  accountHeader: { minHeight: 72, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  backToExplore: { color: colors.green, fontSize: 12, fontWeight: '900' },
  accountTitle: { marginHorizontal: 22, marginTop: 8, marginBottom: 20, color: colors.ink, fontSize: 30, fontWeight: '900' },
  accountPanel: { marginHorizontal: 22, padding: 17, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: colors.deep, fontSize: 18, fontWeight: '900' },
  profileIdentity: { flex: 1, marginLeft: 12 },
  profileName: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  profileEmail: { marginTop: 4, color: colors.muted, fontSize: 11 },
  accountDivider: { height: 1, marginVertical: 16, backgroundColor: colors.line },
  accountDescription: { color: colors.deep, fontSize: 12, lineHeight: 19 },
  accountStatus: { minHeight: 35, marginTop: 14, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  statusLabel: { marginLeft: 8, color: colors.green, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  statusStorage: { marginLeft: 'auto', color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  primaryButton: { minHeight: 49, marginHorizontal: 22, marginTop: 15, paddingHorizontal: 15, borderRadius: 5, backgroundColor: colors.coral, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  primaryButtonArrow: { marginLeft: 8, color: colors.white, fontSize: 18 },
  signOutButton: { minHeight: 47, marginHorizontal: 22, marginTop: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  signOutText: { color: colors.deep, fontSize: 12, fontWeight: '800' },
  bottomTabs: { minHeight: 59, paddingHorizontal: 32, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper, flexDirection: 'row', justifyContent: 'space-around' },
  tabButton: { minWidth: 100, alignItems: 'center' },
  tabIndicator: { width: 24, height: 2, backgroundColor: 'transparent' },
  tabIndicatorActive: { backgroundColor: colors.coral },
  tabLabel: { marginTop: 8, color: colors.muted, fontSize: 10, fontWeight: '700' },
  tabLabelActive: { color: colors.deep, fontWeight: '900' },
});