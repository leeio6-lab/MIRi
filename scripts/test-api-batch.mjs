/**
 * 사주 & 궁합 API 배치 테스트 (gpt-4o-mini 품질 검증)
 * 20개 사주 + 20개 궁합 = 총 40건 호출
 */

const SUPABASE_URL = 'https://ywlbgqhrtautrqyddmef.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bGJncWhydGF1dHJxeWRkbWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTkxODgsImV4cCI6MjA4OTA5NTE4OH0.Eq7x2czHGIeQ-aGEtw7bntsTRMxy6V2dMzcd7PeoybA';

// ─── 20개 사주 테스트 데이터 ───
const SAJU_CASES = [
  { year: 1985, month: 3, day: 15, hour: 6, gender: 'male', name: '김민수' },
  { year: 1990, month: 8, day: 22, hour: 14, gender: 'female', name: '이지은' },
  { year: 1978, month: 12, day: 1, hour: 23, gender: 'male', name: '박성호' },
  { year: 1995, month: 5, day: 10, hour: 8, gender: 'female', name: '최유진' },
  { year: 1988, month: 1, day: 28, hour: 3, gender: 'male', name: '정태웅' },
  { year: 1992, month: 7, day: 4, hour: 11, gender: 'female', name: '한소희' },
  { year: 1975, month: 10, day: 18, hour: 17, gender: 'male', name: '윤재혁' },
  { year: 2000, month: 2, day: 29, hour: 9, gender: 'female', name: '서예린' },
  { year: 1983, month: 6, day: 7, hour: 20, gender: 'male', name: '강동현' },
  { year: 1997, month: 11, day: 30, hour: 0, gender: 'female', name: '임하나' },
  { year: 1970, month: 4, day: 12, hour: 5, gender: 'male', name: '오승철' },
  { year: 1993, month: 9, day: 25, hour: 13, gender: 'female', name: '문지영' },
  { year: 1986, month: 2, day: 14, hour: 16, gender: 'male', name: '배준호' },
  { year: 1999, month: 3, day: 8, hour: 7, gender: 'female', name: '신미래' },
  { year: 1981, month: 8, day: 19, hour: 22, gender: 'male', name: '조현우' },
  { year: 1996, month: 12, day: 3, hour: 10, gender: 'female', name: '황보람' },
  { year: 1974, month: 7, day: 21, hour: 2, gender: 'male', name: '유정민' },
  { year: 2002, month: 1, day: 15, hour: 12, gender: 'female', name: '권수빈' },
  { year: 1989, month: 5, day: 30, hour: 19, gender: 'male', name: '남기훈' },
  { year: 1994, month: 10, day: 10, hour: 4, gender: 'female', name: '전소연' },
];

// ─── 20개 궁합 테스트 데이터 ───
const COMPAT_CASES = [
  { p1: { year: 1990, month: 3, day: 15, hour: 10, gender: 'male' }, p2: { year: 1992, month: 7, day: 20, hour: 14, gender: 'female' }, n1: '김민수', n2: '이지은' },
  { p1: { year: 1985, month: 8, day: 1, hour: 6, gender: 'male' }, p2: { year: 1988, month: 12, day: 25, hour: 8, gender: 'female' }, n1: '박성호', n2: '최유진' },
  { p1: { year: 1993, month: 5, day: 26, hour: 10, gender: 'male' }, p2: { year: 1995, month: 11, day: 3, hour: 15, gender: 'female' }, n1: '윤정훈', n2: '한소희' },
  { p1: { year: 1978, month: 1, day: 10, hour: 22, gender: 'male' }, p2: { year: 1980, month: 6, day: 18, hour: 9, gender: 'female' }, n1: '강동현', n2: '임하나' },
  { p1: { year: 1996, month: 9, day: 8, hour: 7, gender: 'female' }, p2: { year: 1994, month: 4, day: 12, hour: 16, gender: 'male' }, n1: '서예린', n2: '정태웅' },
  { p1: { year: 2000, month: 2, day: 14, hour: 11, gender: 'male' }, p2: { year: 2001, month: 8, day: 30, hour: 3, gender: 'female' }, n1: '배준호', n2: '신미래' },
  { p1: { year: 1975, month: 10, day: 5, hour: 17, gender: 'male' }, p2: { year: 1977, month: 3, day: 22, hour: 12, gender: 'female' }, n1: '오승철', n2: '문지영' },
  { p1: { year: 1988, month: 7, day: 19, hour: 20, gender: 'male' }, p2: { year: 1990, month: 1, day: 7, hour: 5, gender: 'female' }, n1: '조현우', n2: '황보람' },
  { p1: { year: 1992, month: 12, day: 31, hour: 0, gender: 'female' }, p2: { year: 1989, month: 5, day: 15, hour: 13, gender: 'male' }, n1: '전소연', n2: '남기훈' },
  { p1: { year: 1983, month: 4, day: 28, hour: 8, gender: 'male' }, p2: { year: 1986, month: 9, day: 10, hour: 19, gender: 'female' }, n1: '유정민', n2: '권수빈' },
  { p1: { year: 1997, month: 6, day: 3, hour: 14, gender: 'male' }, p2: { year: 1998, month: 11, day: 17, hour: 6, gender: 'female' }, n1: '김도윤', n2: '박서현' },
  { p1: { year: 1970, month: 8, day: 20, hour: 2, gender: 'male' }, p2: { year: 1972, month: 2, day: 5, hour: 10, gender: 'female' }, n1: '이상준', n2: '최은정' },
  { p1: { year: 1999, month: 1, day: 1, hour: 23, gender: 'female' }, p2: { year: 1997, month: 7, day: 14, hour: 11, gender: 'male' }, n1: '장수연', n2: '한재민' },
  { p1: { year: 1986, month: 3, day: 12, hour: 9, gender: 'male' }, p2: { year: 1989, month: 10, day: 28, hour: 17, gender: 'female' }, n1: '송민혁', n2: '노지현' },
  { p1: { year: 1991, month: 11, day: 7, hour: 4, gender: 'female' }, p2: { year: 1988, month: 5, day: 23, hour: 15, gender: 'male' }, n1: '고은비', n2: '안정우' },
  { p1: { year: 2002, month: 4, day: 16, hour: 12, gender: 'male' }, p2: { year: 2003, month: 9, day: 9, hour: 7, gender: 'female' }, n1: '백승현', n2: '윤채원' },
  { p1: { year: 1981, month: 7, day: 25, hour: 18, gender: 'male' }, p2: { year: 1984, month: 12, day: 11, hour: 0, gender: 'female' }, n1: '탁현식', n2: '양미경' },
  { p1: { year: 1995, month: 2, day: 20, hour: 6, gender: 'female' }, p2: { year: 1993, month: 8, day: 8, hour: 21, gender: 'male' }, n1: '류하윤', n2: '임태현' },
  { p1: { year: 1974, month: 5, day: 5, hour: 10, gender: 'male' }, p2: { year: 1976, month: 11, day: 30, hour: 16, gender: 'female' }, n1: '차동석', n2: '홍명숙' },
  { p1: { year: 1998, month: 10, day: 22, hour: 3, gender: 'male' }, p2: { year: 2000, month: 3, day: 18, hour: 13, gender: 'female' }, n1: '도경수', n2: '변서윤' },
];

async function callAPI(path, body) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return resp.json();
}

// ─── 사주 품질 체크 ───
function checkSajuQuality(result, caseName) {
  const issues = [];

  // 1. 용신 일관성
  const yongShinField = result.structure?.yongShin || '';
  // 용신 오행 키워드 체크
  const yongElements = ['목(木)', '화(火)', '토(土)', '금(金)', '수(水)'];
  const foundYong = yongElements.find(e => yongShinField.includes(e));
  if (!foundYong) issues.push('용신: 오행 명시 없음');

  // 2. 필수 필드 체크
  const requiredFields = ['overallScore', 'headline', 'structure', 'personality', 'career', 'wealth', 'love', 'health', 'daeun', 'relationship', 'family', 'academic', 'finalWords'];
  for (const f of requiredFields) {
    if (!result[f]) issues.push(`필드누락: ${f}`);
  }

  // 3. 점수 범위 체크
  if (result.overallScore < 60 || result.overallScore > 88) issues.push(`점수범위: ${result.overallScore}`);
  for (const f of ['wealth', 'love', 'health', 'relationship', 'academic']) {
    const s = result[f]?.score;
    if (s !== undefined && (s < 60 || s > 88)) issues.push(`${f}.score 범위초과: ${s}`);
  }

  // 4. 텍스트 분량 체크
  const lengthChecks = [
    ['personality.core', result.personality?.core?.length, 200],
    ['career.analysis', result.career?.analysis?.length, 150],
    ['wealth.pattern', result.wealth?.pattern?.length, 120],
    ['daeun.current', result.daeun?.current?.length, 120],
    ['finalWords', result.finalWords?.length, 100],
  ];
  for (const [field, len, min] of lengthChecks) {
    if ((len || 0) < min) issues.push(`분량부족: ${field} ${len || 0}자 < ${min}자`);
  }

  // 5. 간지 근거 체크 (한자가 포함되어 있는지)
  const hanjaPattern = /[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/;
  const textFields = [
    result.structure?.dayMaster,
    result.structure?.strength,
    result.structure?.specialNote,
    result.personality?.core,
    result.career?.analysis,
  ];
  let hanjaCount = 0;
  for (const t of textFields) {
    if (t && hanjaPattern.test(t)) hanjaCount++;
  }
  if (hanjaCount < 2) issues.push(`간지근거부족: 한자포함 ${hanjaCount}/5개 필드`);

  // 6. lifeGraph 체크
  const lg = result.daeun?.lifeGraph;
  if (!lg || lg.length < 5) {
    issues.push('lifeGraph: 부족');
  } else {
    const scores = lg.map(d => d.score);
    const range = Math.max(...scores) - Math.min(...scores);
    if (range < 15) issues.push(`lifeGraph 점수편차 ${range} < 15`);
    // label이 한자인지 체크
    const badLabels = lg.filter(d => !hanjaPattern.test(d.label || ''));
    if (badLabels.length > 0) issues.push(`lifeGraph label 한자아님: ${badLabels.length}개`);
  }

  // 7. 이름 사용 체크 (이름이 결과에 들어가는지)
  const allText = JSON.stringify(result);
  // "사람1", "당신" 같은 대명사 사용 체크
  if (allText.includes('사람1') || allText.includes('사람2')) issues.push('대명사 사용: 사람1/사람2');

  return issues;
}

// ─── 궁합 품질 체크 ───
function checkCompatQuality(result, caseName, n1, n2) {
  const issues = [];

  // 1. 필수 필드
  const requiredFields = ['overallScore', 'headline', 'summary', 'categories', 'dayMasterRelation', 'strengthPoints', 'conflictPoints', 'finalWords'];
  for (const f of requiredFields) {
    if (!result[f]) issues.push(`필드누락: ${f}`);
  }

  // 2. 점수 범위
  if (result.overallScore < 35 || result.overallScore > 92) issues.push(`총점범위: ${result.overallScore}`);

  // 3. 카테고리 점수 차등
  if (result.categories) {
    const scores = Object.values(result.categories).map(c => typeof c === 'object' ? c.score : c).filter(s => typeof s === 'number');
    const unique = new Set(scores);
    if (unique.size < scores.length * 0.5) issues.push(`카테고리 점수 차등부족: ${scores.join(',')}`);
    const range = Math.max(...scores) - Math.min(...scores);
    if (range < 15) issues.push(`카테고리 점수범위 ${range} < 15`);
  }

  // 4. 이름 사용 체크
  const allText = JSON.stringify(result);
  if (allText.includes('사람1') || allText.includes('사람2') || allText.includes('Person 1')) {
    issues.push('대명사 사용됨');
  }
  // n1, n2 이름이 실제로 사용되는지
  const givenN1 = n1.length >= 3 ? n1.slice(1) : n1;
  const givenN2 = n2.length >= 3 ? n2.slice(1) : n2;
  if (!allText.includes(givenN1) && !allText.includes(n1)) issues.push(`이름 미사용: ${n1}`);
  if (!allText.includes(givenN2) && !allText.includes(n2)) issues.push(`이름 미사용: ${n2}`);

  // 5. 간지 근거
  const hanjaPattern = /[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/;
  if (!hanjaPattern.test(result.summary || '')) issues.push('summary에 한자근거 없음');

  return issues;
}

// ─── 메인 실행 ───
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all'; // 'saju', 'compat', 'all'

  const sajuResults = [];
  const compatResults = [];

  // 사주 테스트 (5개씩 병렬, 4라운드)
  if (testType === 'saju' || testType === 'all') {
    console.log('=== 사주 분석 테스트 (20건) ===\n');
    for (let batch = 0; batch < 4; batch++) {
      const slice = SAJU_CASES.slice(batch * 5, (batch + 1) * 5);
      const promises = slice.map(c =>
        callAPI('saju', {
          input: { year: c.year, month: c.month, day: c.day, hour: c.hour, gender: c.gender, isLunar: false },
          locale: 'ko', isPaid: true, userName: c.name,
        }).then(r => ({ case: c, result: r })).catch(e => ({ case: c, error: String(e) }))
      );
      const results = await Promise.all(promises);
      for (const r of results) {
        if (r.error) {
          console.log(`X ${r.case.name} (${r.case.year}): ERROR - ${r.error}`);
          sajuResults.push({ name: r.case.name, issues: ['API 오류'], score: 0 });
        } else {
          const issues = checkSajuQuality(r.result, r.case.name);
          const status = issues.length === 0 ? 'O' : `!${issues.length}`;
          console.log(`${status} ${r.case.name} (${r.case.year}): score=${r.result.overallScore} headline="${(r.result.headline || '').substring(0, 40)}..." ${issues.length > 0 ? '\n   ' + issues.join('\n   ') : ''}`);
          sajuResults.push({ name: r.case.name, issues, score: r.result.overallScore, yongShin: r.result.structure?.yongShin?.substring(0, 30), personality_len: r.result.personality?.core?.length });
        }
      }
      console.log(`  [배치 ${batch + 1}/4 완료]\n`);
    }
  }

  // 궁합 테스트 (5개씩 병렬, 4라운드)
  if (testType === 'compat' || testType === 'all') {
    console.log('\n=== 궁합 분석 테스트 (20건) ===\n');
    for (let batch = 0; batch < 4; batch++) {
      const slice = COMPAT_CASES.slice(batch * 5, (batch + 1) * 5);
      const promises = slice.map(c =>
        callAPI('compatibility', {
          person1: c.p1, person2: c.p2, locale: 'ko', isPaid: true,
          name1: c.n1, name2: c.n2,
        }).then(r => ({ case: c, result: r })).catch(e => ({ case: c, error: String(e) }))
      );
      const results = await Promise.all(promises);
      for (const r of results) {
        if (r.error) {
          console.log(`X ${r.case.n1}+${r.case.n2}: ERROR`);
          compatResults.push({ names: `${r.case.n1}+${r.case.n2}`, issues: ['API 오류'] });
        } else {
          const issues = checkCompatQuality(r.result, '', r.case.n1, r.case.n2);
          const status = issues.length === 0 ? 'O' : `!${issues.length}`;
          console.log(`${status} ${r.case.n1}+${r.case.n2}: score=${r.result.overallScore} "${(r.result.headline || '').substring(0, 35)}..." ${issues.length > 0 ? '\n   ' + issues.join('\n   ') : ''}`);
          compatResults.push({ names: `${r.case.n1}+${r.case.n2}`, issues, score: r.result.overallScore });
        }
      }
      console.log(`  [배치 ${batch + 1}/4 완료]\n`);
    }
  }

  // ─── 요약 ───
  console.log('\n' + '='.repeat(60));
  console.log(' 테스트 결과 요약');
  console.log('='.repeat(60));

  if (sajuResults.length > 0) {
    const sajuPass = sajuResults.filter(r => r.issues.length === 0).length;
    console.log(`\n사주: ${sajuPass}/${sajuResults.length} 통과`);
    // 이슈 빈도
    const issueCounts = {};
    for (const r of sajuResults) {
      for (const i of r.issues) {
        const key = i.split(':')[0];
        issueCounts[key] = (issueCounts[key] || 0) + 1;
      }
    }
    if (Object.keys(issueCounts).length > 0) {
      console.log('이슈 빈도:');
      for (const [k, v] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${k}: ${v}건`);
      }
    }
  }

  if (compatResults.length > 0) {
    const compatPass = compatResults.filter(r => r.issues.length === 0).length;
    console.log(`\n궁합: ${compatPass}/${compatResults.length} 통과`);
    const issueCounts = {};
    for (const r of compatResults) {
      for (const i of r.issues) {
        const key = i.split(':')[0];
        issueCounts[key] = (issueCounts[key] || 0) + 1;
      }
    }
    if (Object.keys(issueCounts).length > 0) {
      console.log('이슈 빈도:');
      for (const [k, v] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${k}: ${v}건`);
      }
    }
  }
}

main().catch(console.error);
