// ============================================================
// 전 세계 주요 도시 데이터베이스 (지역시 보정용)
//
// 사주 계산 시 태양시(眞太陽時) 보정에 사용
// 경도 기반으로 표준시 대비 실제 태양시 차이를 계산
// ============================================================

export interface City {
  id: string;            // unique key like 'kr-seoul'
  name: string;          // display name in local script: '서울'
  nameEn: string;        // English name: 'Seoul'
  country: string;       // country code: 'KR'
  countryName: string;   // '한국'
  countryNameEn: string; // 'South Korea'
  longitude: number;     // 126.978
  latitude: number;      // 37.5665
  timezone: string;      // 'Asia/Seoul'
  utcOffset: number;     // 9 (hours from UTC, standard time)
}

export const CITIES: City[] = [
  // ─── 한국 (South Korea) ~15 cities ───
  { id: 'kr-seoul', name: '서울', nameEn: 'Seoul', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.978, latitude: 37.5665, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-busan', name: '부산', nameEn: 'Busan', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 129.0756, latitude: 35.1796, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-daegu', name: '대구', nameEn: 'Daegu', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 128.6014, latitude: 35.8714, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-incheon', name: '인천', nameEn: 'Incheon', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.7052, latitude: 37.4563, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-gwangju', name: '광주', nameEn: 'Gwangju', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.8526, latitude: 35.1595, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-daejeon', name: '대전', nameEn: 'Daejeon', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.3845, latitude: 36.3504, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-ulsan', name: '울산', nameEn: 'Ulsan', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 129.3114, latitude: 35.5384, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-sejong', name: '세종', nameEn: 'Sejong', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.0, latitude: 36.48, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-suwon', name: '수원', nameEn: 'Suwon', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.0286, latitude: 37.2636, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-changwon', name: '창원', nameEn: 'Changwon', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 128.6811, latitude: 35.2281, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-jeonju', name: '전주', nameEn: 'Jeonju', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.1480, latitude: 35.8242, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-cheongju', name: '청주', nameEn: 'Cheongju', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.4890, latitude: 36.6424, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-gyeongju', name: '경주', nameEn: 'Gyeongju', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 129.2247, latitude: 35.8562, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-jeju', name: '제주', nameEn: 'Jeju', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.5312, latitude: 33.4996, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-pohang', name: '포항', nameEn: 'Pohang', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 129.3658, latitude: 36.0190, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-anyang', name: '안양', nameEn: 'Anyang', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.9568, latitude: 37.3943, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-seongnam', name: '성남', nameEn: 'Seongnam', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.1267, latitude: 37.4200, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-goyang', name: '고양', nameEn: 'Goyang', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.8320, latitude: 37.6584, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-yongin', name: '용인', nameEn: 'Yongin', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.1775, latitude: 37.2411, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-bucheon', name: '부천', nameEn: 'Bucheon', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.7660, latitude: 37.5034, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-hwaseong', name: '화성', nameEn: 'Hwaseong', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.8312, latitude: 37.1995, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-namyangju', name: '남양주', nameEn: 'Namyangju', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.2164, latitude: 37.6360, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-pyeongtaek', name: '평택', nameEn: 'Pyeongtaek', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.0889, latitude: 36.9921, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-uijeongbu', name: '의정부', nameEn: 'Uijeongbu', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.0340, latitude: 37.7381, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-siheung', name: '시흥', nameEn: 'Siheung', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.8031, latitude: 37.3800, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-gwangmyeong', name: '광명', nameEn: 'Gwangmyeong', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.8641, latitude: 37.4784, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-gimpo', name: '김포', nameEn: 'Gimpo', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.7156, latitude: 37.6152, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-gunpo', name: '군포', nameEn: 'Gunpo', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.9353, latitude: 37.3616, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-hanam', name: '하남', nameEn: 'Hanam', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.2148, latitude: 37.5393, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-icheon', name: '이천', nameEn: 'Icheon', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.4350, latitude: 37.2721, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-asan', name: '아산', nameEn: 'Asan', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.0024, latitude: 36.7898, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-cheonan', name: '천안', nameEn: 'Cheonan', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.1524, latitude: 36.8151, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-gimhae', name: '김해', nameEn: 'Gimhae', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 128.8893, latitude: 35.2285, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-iksan', name: '익산', nameEn: 'Iksan', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.9579, latitude: 35.9483, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-gumi', name: '구미', nameEn: 'Gumi', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 128.3444, latitude: 36.1197, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-yeosu', name: '여수', nameEn: 'Yeosu', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.6626, latitude: 34.7604, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-mokpo', name: '목포', nameEn: 'Mokpo', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.3925, latitude: 34.8118, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-andong', name: '안동', nameEn: 'Andong', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 128.7297, latitude: 36.5684, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-paju', name: '파주', nameEn: 'Paju', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 126.7800, latitude: 37.7590, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-yangsan', name: '양산', nameEn: 'Yangsan', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 129.0323, latitude: 35.3350, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-gwangyang', name: '광양', nameEn: 'Gwangyang', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.7369, latitude: 34.9407, timezone: 'Asia/Seoul', utcOffset: 9 },

  // ─── 일본 (Japan) ~10 cities ───
  { id: 'jp-tokyo', name: '東京', nameEn: 'Tokyo', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 139.6917, latitude: 35.6895, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'jp-osaka', name: '大阪', nameEn: 'Osaka', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 135.5023, latitude: 34.6937, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'jp-nagoya', name: '名古屋', nameEn: 'Nagoya', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 136.9066, latitude: 35.1815, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'jp-fukuoka', name: '福岡', nameEn: 'Fukuoka', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 130.4017, latitude: 33.5904, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'jp-sapporo', name: '札幌', nameEn: 'Sapporo', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 141.3469, latitude: 43.0618, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'jp-kyoto', name: '京都', nameEn: 'Kyoto', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 135.7681, latitude: 35.0116, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'jp-kobe', name: '神戸', nameEn: 'Kobe', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 135.1956, latitude: 34.6901, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'jp-yokohama', name: '横浜', nameEn: 'Yokohama', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 139.6380, latitude: 35.4437, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'jp-hiroshima', name: '広島', nameEn: 'Hiroshima', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 132.4596, latitude: 34.3853, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'jp-okinawa', name: '沖縄', nameEn: 'Okinawa', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 127.6809, latitude: 26.3344, timezone: 'Asia/Tokyo', utcOffset: 9 },

  // ─── 중국 (China) ~8 cities ───
  { id: 'cn-beijing', name: '北京', nameEn: 'Beijing', country: 'CN', countryName: '중국', countryNameEn: 'China', longitude: 116.4074, latitude: 39.9042, timezone: 'Asia/Shanghai', utcOffset: 8 },
  { id: 'cn-shanghai', name: '上海', nameEn: 'Shanghai', country: 'CN', countryName: '중국', countryNameEn: 'China', longitude: 121.4737, latitude: 31.2304, timezone: 'Asia/Shanghai', utcOffset: 8 },
  { id: 'cn-guangzhou', name: '广州', nameEn: 'Guangzhou', country: 'CN', countryName: '중국', countryNameEn: 'China', longitude: 113.2644, latitude: 23.1291, timezone: 'Asia/Shanghai', utcOffset: 8 },
  { id: 'cn-shenzhen', name: '深圳', nameEn: 'Shenzhen', country: 'CN', countryName: '중국', countryNameEn: 'China', longitude: 114.0579, latitude: 22.5431, timezone: 'Asia/Shanghai', utcOffset: 8 },
  { id: 'cn-chengdu', name: '成都', nameEn: 'Chengdu', country: 'CN', countryName: '중국', countryNameEn: 'China', longitude: 104.0665, latitude: 30.5723, timezone: 'Asia/Shanghai', utcOffset: 8 },
  { id: 'cn-xian', name: '西安', nameEn: "Xi'an", country: 'CN', countryName: '중국', countryNameEn: 'China', longitude: 108.9402, latitude: 34.2658, timezone: 'Asia/Shanghai', utcOffset: 8 },
  { id: 'cn-chongqing', name: '重庆', nameEn: 'Chongqing', country: 'CN', countryName: '중국', countryNameEn: 'China', longitude: 106.5516, latitude: 29.5630, timezone: 'Asia/Shanghai', utcOffset: 8 },
  { id: 'cn-hangzhou', name: '杭州', nameEn: 'Hangzhou', country: 'CN', countryName: '중국', countryNameEn: 'China', longitude: 120.1551, latitude: 30.2741, timezone: 'Asia/Shanghai', utcOffset: 8 },

  // ─── 미국 (United States) ~12 cities ───
  { id: 'us-newyork', name: 'New York', nameEn: 'New York', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -74.0060, latitude: 40.7128, timezone: 'America/New_York', utcOffset: -5 },
  { id: 'us-losangeles', name: 'Los Angeles', nameEn: 'Los Angeles', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -118.2437, latitude: 34.0522, timezone: 'America/Los_Angeles', utcOffset: -8 },
  { id: 'us-chicago', name: 'Chicago', nameEn: 'Chicago', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -87.6298, latitude: 41.8781, timezone: 'America/Chicago', utcOffset: -6 },
  { id: 'us-houston', name: 'Houston', nameEn: 'Houston', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -95.3698, latitude: 29.7604, timezone: 'America/Chicago', utcOffset: -6 },
  { id: 'us-phoenix', name: 'Phoenix', nameEn: 'Phoenix', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -112.0740, latitude: 33.4484, timezone: 'America/Phoenix', utcOffset: -7 },
  { id: 'us-philadelphia', name: 'Philadelphia', nameEn: 'Philadelphia', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -75.1652, latitude: 39.9526, timezone: 'America/New_York', utcOffset: -5 },
  { id: 'us-sanantonio', name: 'San Antonio', nameEn: 'San Antonio', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -98.4936, latitude: 29.4241, timezone: 'America/Chicago', utcOffset: -6 },
  { id: 'us-sandiego', name: 'San Diego', nameEn: 'San Diego', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -117.1611, latitude: 32.7157, timezone: 'America/Los_Angeles', utcOffset: -8 },
  { id: 'us-dallas', name: 'Dallas', nameEn: 'Dallas', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -96.7970, latitude: 32.7767, timezone: 'America/Chicago', utcOffset: -6 },
  { id: 'us-sanfrancisco', name: 'San Francisco', nameEn: 'San Francisco', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -122.4194, latitude: 37.7749, timezone: 'America/Los_Angeles', utcOffset: -8 },
  { id: 'us-seattle', name: 'Seattle', nameEn: 'Seattle', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -122.3321, latitude: 47.6062, timezone: 'America/Los_Angeles', utcOffset: -8 },
  { id: 'us-honolulu', name: 'Honolulu', nameEn: 'Honolulu', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -157.8583, latitude: 21.3069, timezone: 'Pacific/Honolulu', utcOffset: -10 },

  // ─── 유럽 (Europe) ~12 cities ───
  { id: 'gb-london', name: 'London', nameEn: 'London', country: 'GB', countryName: '영국', countryNameEn: 'United Kingdom', longitude: -0.1278, latitude: 51.5074, timezone: 'Europe/London', utcOffset: 0 },
  { id: 'fr-paris', name: 'Paris', nameEn: 'Paris', country: 'FR', countryName: '프랑스', countryNameEn: 'France', longitude: 2.3522, latitude: 48.8566, timezone: 'Europe/Paris', utcOffset: 1 },
  { id: 'de-berlin', name: 'Berlin', nameEn: 'Berlin', country: 'DE', countryName: '독일', countryNameEn: 'Germany', longitude: 13.4050, latitude: 52.5200, timezone: 'Europe/Berlin', utcOffset: 1 },
  { id: 'it-rome', name: 'Roma', nameEn: 'Rome', country: 'IT', countryName: '이탈리아', countryNameEn: 'Italy', longitude: 12.4964, latitude: 41.9028, timezone: 'Europe/Rome', utcOffset: 1 },
  { id: 'es-madrid', name: 'Madrid', nameEn: 'Madrid', country: 'ES', countryName: '스페인', countryNameEn: 'Spain', longitude: -3.7038, latitude: 40.4168, timezone: 'Europe/Madrid', utcOffset: 1 },
  { id: 'nl-amsterdam', name: 'Amsterdam', nameEn: 'Amsterdam', country: 'NL', countryName: '네덜란드', countryNameEn: 'Netherlands', longitude: 4.9041, latitude: 52.3676, timezone: 'Europe/Amsterdam', utcOffset: 1 },
  { id: 'ch-zurich', name: 'Zürich', nameEn: 'Zurich', country: 'CH', countryName: '스위스', countryNameEn: 'Switzerland', longitude: 8.5417, latitude: 47.3769, timezone: 'Europe/Zurich', utcOffset: 1 },
  { id: 'at-vienna', name: 'Wien', nameEn: 'Vienna', country: 'AT', countryName: '오스트리아', countryNameEn: 'Austria', longitude: 16.3738, latitude: 48.2082, timezone: 'Europe/Vienna', utcOffset: 1 },
  { id: 'se-stockholm', name: 'Stockholm', nameEn: 'Stockholm', country: 'SE', countryName: '스웨덴', countryNameEn: 'Sweden', longitude: 18.0686, latitude: 59.3293, timezone: 'Europe/Stockholm', utcOffset: 1 },
  { id: 'pt-lisbon', name: 'Lisboa', nameEn: 'Lisbon', country: 'PT', countryName: '포르투갈', countryNameEn: 'Portugal', longitude: -9.1393, latitude: 38.7223, timezone: 'Europe/Lisbon', utcOffset: 0 },
  { id: 'cz-prague', name: 'Praha', nameEn: 'Prague', country: 'CZ', countryName: '체코', countryNameEn: 'Czech Republic', longitude: 14.4378, latitude: 50.0755, timezone: 'Europe/Prague', utcOffset: 1 },
  { id: 'gr-athens', name: 'Αθήνα', nameEn: 'Athens', country: 'GR', countryName: '그리스', countryNameEn: 'Greece', longitude: 23.7275, latitude: 37.9838, timezone: 'Europe/Athens', utcOffset: 2 },

  // ─── 동남아시아 (Southeast Asia) ~8 cities ───
  { id: 'th-bangkok', name: 'กรุงเทพ', nameEn: 'Bangkok', country: 'TH', countryName: '태국', countryNameEn: 'Thailand', longitude: 100.5018, latitude: 13.7563, timezone: 'Asia/Bangkok', utcOffset: 7 },
  { id: 'sg-singapore', name: 'Singapore', nameEn: 'Singapore', country: 'SG', countryName: '싱가포르', countryNameEn: 'Singapore', longitude: 103.8198, latitude: 1.3521, timezone: 'Asia/Singapore', utcOffset: 8 },
  { id: 'id-jakarta', name: 'Jakarta', nameEn: 'Jakarta', country: 'ID', countryName: '인도네시아', countryNameEn: 'Indonesia', longitude: 106.8456, latitude: -6.2088, timezone: 'Asia/Jakarta', utcOffset: 7 },
  { id: 'ph-manila', name: 'Manila', nameEn: 'Manila', country: 'PH', countryName: '필리핀', countryNameEn: 'Philippines', longitude: 120.9842, latitude: 14.5995, timezone: 'Asia/Manila', utcOffset: 8 },
  { id: 'vn-hanoi', name: 'Hà Nội', nameEn: 'Hanoi', country: 'VN', countryName: '베트남', countryNameEn: 'Vietnam', longitude: 105.8342, latitude: 21.0278, timezone: 'Asia/Ho_Chi_Minh', utcOffset: 7 },
  { id: 'vn-hochiminh', name: 'Hồ Chí Minh', nameEn: 'Ho Chi Minh City', country: 'VN', countryName: '베트남', countryNameEn: 'Vietnam', longitude: 106.6297, latitude: 10.8231, timezone: 'Asia/Ho_Chi_Minh', utcOffset: 7 },
  { id: 'my-kualalumpur', name: 'Kuala Lumpur', nameEn: 'Kuala Lumpur', country: 'MY', countryName: '말레이시아', countryNameEn: 'Malaysia', longitude: 101.6869, latitude: 3.1390, timezone: 'Asia/Kuala_Lumpur', utcOffset: 8 },
  { id: 'mm-yangon', name: 'ရန်ကုန်', nameEn: 'Yangon', country: 'MM', countryName: '미얀마', countryNameEn: 'Myanmar', longitude: 96.1951, latitude: 16.8661, timezone: 'Asia/Yangon', utcOffset: 6.5 },

  // ─── 기타 주요 도시 (Other Major Cities) ~15 cities ───
  { id: 'au-sydney', name: 'Sydney', nameEn: 'Sydney', country: 'AU', countryName: '호주', countryNameEn: 'Australia', longitude: 151.2093, latitude: -33.8688, timezone: 'Australia/Sydney', utcOffset: 10 },
  { id: 'au-melbourne', name: 'Melbourne', nameEn: 'Melbourne', country: 'AU', countryName: '호주', countryNameEn: 'Australia', longitude: 144.9631, latitude: -37.8136, timezone: 'Australia/Melbourne', utcOffset: 10 },
  { id: 'ae-dubai', name: 'Dubai', nameEn: 'Dubai', country: 'AE', countryName: 'UAE', countryNameEn: 'United Arab Emirates', longitude: 55.2708, latitude: 25.2048, timezone: 'Asia/Dubai', utcOffset: 4 },
  { id: 'in-mumbai', name: 'Mumbai', nameEn: 'Mumbai', country: 'IN', countryName: '인도', countryNameEn: 'India', longitude: 72.8777, latitude: 19.0760, timezone: 'Asia/Kolkata', utcOffset: 5.5 },
  { id: 'in-delhi', name: 'Delhi', nameEn: 'Delhi', country: 'IN', countryName: '인도', countryNameEn: 'India', longitude: 77.1025, latitude: 28.7041, timezone: 'Asia/Kolkata', utcOffset: 5.5 },
  { id: 'in-bangalore', name: 'Bangalore', nameEn: 'Bangalore', country: 'IN', countryName: '인도', countryNameEn: 'India', longitude: 77.5946, latitude: 12.9716, timezone: 'Asia/Kolkata', utcOffset: 5.5 },
  { id: 'br-saopaulo', name: 'São Paulo', nameEn: 'Sao Paulo', country: 'BR', countryName: '브라질', countryNameEn: 'Brazil', longitude: -46.6333, latitude: -23.5505, timezone: 'America/Sao_Paulo', utcOffset: -3 },
  { id: 'br-rio', name: 'Rio de Janeiro', nameEn: 'Rio de Janeiro', country: 'BR', countryName: '브라질', countryNameEn: 'Brazil', longitude: -43.1729, latitude: -22.9068, timezone: 'America/Sao_Paulo', utcOffset: -3 },
  { id: 'ca-toronto', name: 'Toronto', nameEn: 'Toronto', country: 'CA', countryName: '캐나다', countryNameEn: 'Canada', longitude: -79.3832, latitude: 43.6532, timezone: 'America/Toronto', utcOffset: -5 },
  { id: 'ca-vancouver', name: 'Vancouver', nameEn: 'Vancouver', country: 'CA', countryName: '캐나다', countryNameEn: 'Canada', longitude: -123.1216, latitude: 49.2827, timezone: 'America/Vancouver', utcOffset: -8 },
  { id: 'mx-mexicocity', name: 'Ciudad de México', nameEn: 'Mexico City', country: 'MX', countryName: '멕시코', countryNameEn: 'Mexico', longitude: -99.1332, latitude: 19.4326, timezone: 'America/Mexico_City', utcOffset: -6 },
  { id: 'ru-moscow', name: 'Москва', nameEn: 'Moscow', country: 'RU', countryName: '러시아', countryNameEn: 'Russia', longitude: 37.6173, latitude: 55.7558, timezone: 'Europe/Moscow', utcOffset: 3 },
  { id: 'tr-istanbul', name: 'İstanbul', nameEn: 'Istanbul', country: 'TR', countryName: '튀르키예', countryNameEn: 'Turkey', longitude: 28.9784, latitude: 41.0082, timezone: 'Europe/Istanbul', utcOffset: 3 },
  { id: 'eg-cairo', name: 'القاهرة', nameEn: 'Cairo', country: 'EG', countryName: '이집트', countryNameEn: 'Egypt', longitude: 31.2357, latitude: 30.0444, timezone: 'Africa/Cairo', utcOffset: 2 },
  { id: 'za-johannesburg', name: 'Johannesburg', nameEn: 'Johannesburg', country: 'ZA', countryName: '남아프리카', countryNameEn: 'South Africa', longitude: 28.0473, latitude: -26.2041, timezone: 'Africa/Johannesburg', utcOffset: 2 },
  { id: 'nz-auckland', name: 'Auckland', nameEn: 'Auckland', country: 'NZ', countryName: '뉴질랜드', countryNameEn: 'New Zealand', longitude: 174.7633, latitude: -36.8485, timezone: 'Pacific/Auckland', utcOffset: 12 },
  { id: 'tw-taipei', name: '台北', nameEn: 'Taipei', country: 'TW', countryName: '대만', countryNameEn: 'Taiwan', longitude: 121.5654, latitude: 25.0330, timezone: 'Asia/Taipei', utcOffset: 8 },
  { id: 'hk-hongkong', name: '香港', nameEn: 'Hong Kong', country: 'HK', countryName: '홍콩', countryNameEn: 'Hong Kong', longitude: 114.1694, latitude: 22.3193, timezone: 'Asia/Hong_Kong', utcOffset: 8 },

  // ─── 추가 주요 도시 ───
  { id: 'kr-wonju', name: '원주', nameEn: 'Wonju', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.9445, latitude: 37.3422, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'kr-chuncheon', name: '춘천', nameEn: 'Chuncheon', country: 'KR', countryName: '한국', countryNameEn: 'South Korea', longitude: 127.7295, latitude: 37.8813, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'jp-sendai', name: '仙台', nameEn: 'Sendai', country: 'JP', countryName: '일본', countryNameEn: 'Japan', longitude: 140.8720, latitude: 38.2682, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'cn-wuhan', name: '武汉', nameEn: 'Wuhan', country: 'CN', countryName: '중국', countryNameEn: 'China', longitude: 114.2986, latitude: 30.5844, timezone: 'Asia/Shanghai', utcOffset: 8 },
  { id: 'cn-nanjing', name: '南京', nameEn: 'Nanjing', country: 'CN', countryName: '중국', countryNameEn: 'China', longitude: 118.7969, latitude: 32.0603, timezone: 'Asia/Shanghai', utcOffset: 8 },
  { id: 'us-denver', name: 'Denver', nameEn: 'Denver', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -104.9903, latitude: 39.7392, timezone: 'America/Denver', utcOffset: -7 },
  { id: 'us-miami', name: 'Miami', nameEn: 'Miami', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -80.1918, latitude: 25.7617, timezone: 'America/New_York', utcOffset: -5 },
  { id: 'us-boston', name: 'Boston', nameEn: 'Boston', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -71.0589, latitude: 42.3601, timezone: 'America/New_York', utcOffset: -5 },
  { id: 'us-atlanta', name: 'Atlanta', nameEn: 'Atlanta', country: 'US', countryName: '미국', countryNameEn: 'United States', longitude: -84.3880, latitude: 33.7490, timezone: 'America/New_York', utcOffset: -5 },
  { id: 'de-munich', name: 'München', nameEn: 'Munich', country: 'DE', countryName: '독일', countryNameEn: 'Germany', longitude: 11.5820, latitude: 48.1351, timezone: 'Europe/Berlin', utcOffset: 1 },
  { id: 'es-barcelona', name: 'Barcelona', nameEn: 'Barcelona', country: 'ES', countryName: '스페인', countryNameEn: 'Spain', longitude: 2.1734, latitude: 41.3874, timezone: 'Europe/Madrid', utcOffset: 1 },
  { id: 'it-milan', name: 'Milano', nameEn: 'Milan', country: 'IT', countryName: '이탈리아', countryNameEn: 'Italy', longitude: 9.1900, latitude: 45.4642, timezone: 'Europe/Rome', utcOffset: 1 },
  { id: 'pl-warsaw', name: 'Warszawa', nameEn: 'Warsaw', country: 'PL', countryName: '폴란드', countryNameEn: 'Poland', longitude: 21.0122, latitude: 52.2297, timezone: 'Europe/Warsaw', utcOffset: 1 },
  { id: 'dk-copenhagen', name: 'København', nameEn: 'Copenhagen', country: 'DK', countryName: '덴마크', countryNameEn: 'Denmark', longitude: 12.5683, latitude: 55.6761, timezone: 'Europe/Copenhagen', utcOffset: 1 },
  { id: 'ar-buenosaires', name: 'Buenos Aires', nameEn: 'Buenos Aires', country: 'AR', countryName: '아르헨티나', countryNameEn: 'Argentina', longitude: -58.3816, latitude: -34.6037, timezone: 'America/Argentina/Buenos_Aires', utcOffset: -3 },
  { id: 'cl-santiago', name: 'Santiago', nameEn: 'Santiago', country: 'CL', countryName: '칠레', countryNameEn: 'Chile', longitude: -70.6693, latitude: -33.4489, timezone: 'America/Santiago', utcOffset: -4 },
  { id: 'kh-phnompenh', name: 'Phnom Penh', nameEn: 'Phnom Penh', country: 'KH', countryName: '캄보디아', countryNameEn: 'Cambodia', longitude: 104.9282, latitude: 11.5564, timezone: 'Asia/Phnom_Penh', utcOffset: 7 },
];

// Group cities by country for UI picker
export const CITIES_BY_COUNTRY: Record<string, City[]> = CITIES.reduce(
  (acc, city) => {
    if (!acc[city.country]) {
      acc[city.country] = [];
    }
    acc[city.country].push(city);
    return acc;
  },
  {} as Record<string, City[]>
);

// Country display order (Korea first, then by region)
export const COUNTRY_ORDER: string[] = [
  'KR', 'JP', 'CN', 'TW', 'HK',
  'US', 'CA', 'MX', 'BR', 'AR', 'CL',
  'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'CH', 'AT', 'SE', 'PT', 'CZ', 'GR', 'PL', 'DK',
  'TH', 'SG', 'ID', 'PH', 'VN', 'MY', 'MM', 'KH',
  'AU', 'NZ', 'AE', 'IN', 'RU', 'TR', 'EG', 'ZA',
];

/**
 * Find a city by its ID
 */
export function getCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

/**
 * Search cities by name (local or English), case-insensitive
 */
export function searchCities(query: string): City[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.countryName.includes(q) ||
      c.countryNameEn.toLowerCase().includes(q)
  );
}
