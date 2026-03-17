type Lang3 = { ko: string; en: string; ja: string };

export interface DailyDetail {
  message: Lang3;
  work: Lang3;
  money: Lang3;
  relation: Lang3;
  luckyHour: Lang3;
}

export const DAILY_DETAILS: Record<string, DailyDetail> = {
  비견: {
    message: { ko: '나와 비슷한 에너지를 가진 사람을 만날 수 있는 날. 경쟁보다 협력이 답이에요.', en: 'A day to meet someone with similar energy. Cooperation beats competition today.', ja: '似たエネルギーを持つ人と出会える日。競争より協力が正解です。' },
    work: { ko: '동료와 협업하면 시너지가 나요. 혼자 하려 하지 마세요.', en: 'Collaborate with colleagues for synergy. Don\'t try to go it alone.', ja: '同僚と協力すればシナジーが生まれます。一人でやろうとしないで。' },
    money: { ko: '지출이 겹칠 수 있어요. 고정비를 한번 체크해보세요.', en: 'Expenses may overlap today. Double-check your fixed costs.', ja: '出費が重なるかも。固定費を一度チェックしてみて。' },
    relation: { ko: '비슷한 성향의 사람과 잘 통하는 날이에요.', en: 'You\'ll click with people who share your vibe today.', ja: '似た性格の人とうまくいく日です。' },
    luckyHour: { ko: '오전 9~11시', en: '9-11 AM', ja: '午前9~11時' },
  },
  겁재: {
    message: { ko: '예상치 못한 변수가 생길 수 있어요. 유연하게 대처하세요. 고집은 손해.', en: 'Unexpected changes may arise. Stay flexible. Stubbornness will cost you.', ja: '予想外の変数が生じるかも。柔軟に対処して。頑固は損。' },
    work: { ko: '계획 변경에 대비하세요. 플랜B를 준비해두면 안심이에요.', en: 'Prepare for plan changes. Having a Plan B will ease your mind.', ja: '計画変更に備えて。プランBを用意しておけば安心。' },
    money: { ko: '친구와의 금전 거래 주의. 빌려주면 돌아오기 어려워요.', en: 'Be careful with money between friends. Loans may not come back.', ja: '友人とのお金の貸し借りに注意。貸したら戻りにくいかも。' },
    relation: { ko: '가까운 사람과 사소한 다툼 주의. 한 발 양보하세요.', en: 'Watch for minor conflicts with close ones. Take a step back.', ja: '親しい人との些細な口論に注意。一歩譲ってみて。' },
    luckyHour: { ko: '오후 3~5시', en: '3-5 PM', ja: '午後3~5時' },
  },
  식신: {
    message: { ko: '아이디어가 빛나는 날. 머릿속에 떠오른 것을 바로 메모하세요.', en: 'A day when ideas shine. Jot down whatever pops into your head immediately.', ja: 'アイデアが輝く日。頭に浮かんだことをすぐメモして。' },
    work: { ko: '기획서, 프레젠테이션에 최적. 창의력을 믿으세요.', en: 'Perfect for proposals and presentations. Trust your creativity.', ja: '企画書やプレゼンに最適。創造力を信じて。' },
    money: { ko: '소소한 지출은 OK. 맛있는 음식에 쓰는 돈은 아깝지 않아요.', en: 'Small treats are fine. Money spent on good food won\'t be regretted.', ja: 'ちょっとした出費はOK。美味しい食事へのお金は惜しくない。' },
    relation: { ko: '대화가 잘 통하는 날. 미뤘던 연락을 해보세요.', en: 'Communication flows easily today. Reach out to someone you\'ve been meaning to.', ja: '会話がスムーズな日。先延ばしにしていた連絡をしてみて。' },
    luckyHour: { ko: '오후 1~3시', en: '1-3 PM', ja: '午後1~3時' },
  },
  상관: {
    message: { ko: '표현력이 극대화되는 날. 하지만 말이 날카로울 수 있어요. 한 박자 쉬고 말하세요.', en: 'Your expressiveness peaks today. But words can cut sharp — pause before speaking.', ja: '表現力が最大化する日。でも言葉が鋭くなりがち。一拍置いてから話して。' },
    work: { ko: '비판적 시각이 빛나지만 윗사람에게는 부드럽게. 전달 방식이 핵심.', en: 'Your critical eye shines, but soften your tone with superiors. Delivery is key.', ja: '批判的な視点が光るけど、上司には柔らかく。伝え方がカギ。' },
    money: { ko: '감정적 소비 주의. 화풀이 쇼핑은 내일 반드시 후회해요.', en: 'Watch for emotional spending. Retail therapy today means regret tomorrow.', ja: '感情的な消費に注意。ストレス買いは明日必ず後悔する。' },
    relation: { ko: '솔직함이 독이 될 수 있는 날. 생각의 70%만 말하세요.', en: 'Honesty can backfire today. Share only 70% of what you think.', ja: '正直さが裏目に出る日。考えの70%だけ話して。' },
    luckyHour: { ko: '오전 11시~오후 1시', en: '11 AM - 1 PM', ja: '午前11時~午後1時' },
  },
  편재: {
    message: { ko: '예상 못한 곳에서 기회가 올 수 있어요. 눈을 크게 뜨고 다니세요.', en: 'Opportunities may come from unexpected places. Keep your eyes wide open.', ja: '思いがけないところからチャンスが来るかも。目を大きく開けて。' },
    work: { ko: '새로운 프로젝트나 제안에 열린 마음을 가지세요. 사이드잡 기회도 있어요.', en: 'Stay open to new projects or proposals. Side gig opportunities may appear.', ja: '新しいプロジェクトや提案にオープンに。副業のチャンスも。' },
    money: { ko: '돈이 들어올 수 있지만 나가는 것도 클 수 있어요. 수입과 지출 둘 다 커지는 날.', en: 'Money may come in, but expenses can be big too. Both income and spending grow today.', ja: 'お金が入るかもしれないけど出費も大きくなりがち。収支ともに大きい日。' },
    relation: { ko: '새로운 사람과의 인연이 열릴 수 있어요. 모임에 나가보세요.', en: 'New connections may open up. Try attending a gathering or meetup.', ja: '新しい人との縁が開くかも。集まりに参加してみて。' },
    luckyHour: { ko: '오후 5~7시', en: '5-7 PM', ja: '午後5~7時' },
  },
  정재: {
    message: { ko: '꾸준히 해온 것의 결실이 보이는 날. 새로운 것보다 진행 중인 일에 집중하세요.', en: 'A day to see results of steady effort. Focus on ongoing work, not new ventures.', ja: 'コツコツやってきたことの成果が見える日。新しいことより進行中の仕事に集中。' },
    work: { ko: '안정적 성과가 나와요. 무리하게 새 일을 벌이지 말고 마무리에 집중.', en: 'Steady results ahead. Don\'t overextend — focus on wrapping things up.', ja: '安定した成果が出る。無理に新しいことを始めず、仕上げに集中。' },
    money: { ko: '저축에 좋은 날. 자동이체 설정이나 적금 가입을 고려해보세요.', en: 'Great day for saving. Consider setting up auto-transfers or a savings plan.', ja: '貯蓄に良い日。自動振込設定や積立を検討してみて。' },
    relation: { ko: '가까운 사람과 따뜻한 시간을 보내세요. 밥 한끼 같이 하면 좋아요.', en: 'Spend warm moments with loved ones. A shared meal goes a long way.', ja: '親しい人と温かい時間を。一緒にご飯を食べると良い。' },
    luckyHour: { ko: '오전 7~9시', en: '7-9 AM', ja: '午前7~9時' },
  },
  편관: {
    message: { ko: '압박감이 있을 수 있지만 그게 성장의 신호예요. 도망가지 마세요.', en: 'You may feel pressure, but that\'s a sign of growth. Don\'t run away.', ja: 'プレッシャーがあるかもしれないけど、それは成長のサイン。逃げないで。' },
    work: { ko: '상사나 고객의 요구가 까다로울 수 있어요. 여기서 인정받으면 크게 올라가요.', en: 'Boss or client demands may be tough. But proving yourself here means big leaps.', ja: '上司やクライアントの要求が厳しいかも。ここで認められれば大きく飛躍。' },
    money: { ko: '예상치 못한 지출(벌금, 수리비 등) 가능. 비상금을 확인하세요.', en: 'Unexpected expenses (fines, repairs) possible. Check your emergency fund.', ja: '予想外の出費（罰金、修理費など）の可能性。緊急資金を確認して。' },
    relation: { ko: '권위적인 사람과의 관계에 긴장감. 감정 대응 대신 팩트로 대처하세요.', en: 'Tension with authority figures. Respond with facts, not emotions.', ja: '権威的な人との関係に緊張感。感情ではなく事実で対処して。' },
    luckyHour: { ko: '오후 7~9시', en: '7-9 PM', ja: '午後7~9時' },
  },
  정관: {
    message: { ko: '맡은 일을 제대로 하면 인정받는 날. 원칙을 지키는 게 최고의 전략이에요.', en: 'Do your job well and you\'ll be recognized. Sticking to principles is the best strategy.', ja: '任された仕事をきちんとやれば認められる日。原則を守るのが最高の戦略。' },
    work: { ko: '상사에게 신뢰를 얻을 수 있는 날. 꼼꼼하게, 기한 내에 마무리하세요.', en: 'A day to earn your boss\'s trust. Be thorough and meet your deadlines.', ja: '上司の信頼を得られる日。丁寧に、期限内に仕上げて。' },
    money: { ko: '안정적이에요. 큰 변동 없이 계획대로 흘러가는 날.', en: 'Financially stable. Things flow as planned without major fluctuations.', ja: '安定している。大きな変動なく計画通りに流れる日。' },
    relation: { ko: '예의와 매너가 통하는 날. 격식 있는 자리에서 빛나요.', en: 'Manners and etiquette shine today. You\'ll stand out in formal settings.', ja: '礼儀とマナーが通じる日。フォーマルな場で輝く。' },
    luckyHour: { ko: '오전 9~11시', en: '9-11 AM', ja: '午前9~11時' },
  },
  편인: {
    message: { ko: '머리가 복잡해지기 쉬운 날. 생각이 많아지면 밖에 나가서 걸으세요.', en: 'Your mind may get cluttered today. When overthinking hits, go for a walk.', ja: '頭が複雑になりやすい日。考えすぎたら外に出て歩いて。' },
    work: { ko: '분석, 리서치, 공부에 최적. 실행보다 준비에 집중하세요.', en: 'Perfect for analysis, research, and study. Focus on preparation over execution.', ja: '分析、リサーチ、勉強に最適。実行より準備に集中して。' },
    money: { ko: '돈보다 시간을 아끼세요. 시간을 사는 지출은 오늘은 괜찮아요.', en: 'Save time over money. Spending to buy time is okay today.', ja: 'お金より時間を大切に。時間を買う出費は今日はOK。' },
    relation: { ko: '혼자만의 시간이 필요할 수 있어요. 억지로 약속을 잡지 마세요.', en: 'You may need alone time. Don\'t force yourself into social plans.', ja: '一人の時間が必要かも。無理に予定を入れないで。' },
    luckyHour: { ko: '오후 9~11시', en: '9-11 PM', ja: '午後9~11時' },
  },
  정인: {
    message: { ko: '마음이 안정되는 날. 배움에 좋은 기운이에요. 책을 읽거나 강의를 들어보세요.', en: 'A peaceful day with great energy for learning. Try reading or taking a class.', ja: '心が安定する日。学びに良い気。本を読んだり講義を聞いてみて。' },
    work: { ko: '멘토나 선배에게 배움을 구하면 좋은 답을 얻을 수 있어요.', en: 'Seek guidance from mentors or seniors — you\'ll get great answers.', ja: 'メンターや先輩に学びを求めれば良い答えが得られる。' },
    money: { ko: '교육, 자기계발에 쓰는 돈은 나중에 몇 배로 돌아와요.', en: 'Money spent on education and self-improvement returns manyfold later.', ja: '教育や自己啓発に使うお金は後で何倍にもなって返ってくる。' },
    relation: { ko: '어머니나 어른과의 관계가 따뜻해지는 날. 안부 전화 한 통 드리세요.', en: 'Warmth grows with parents or elders. Give them a quick call.', ja: '母親や年長者との関係が温かくなる日。安否の電話を一本。' },
    luckyHour: { ko: '오전 5~7시', en: '5-7 AM', ja: '午前5~7時' },
  },
};
