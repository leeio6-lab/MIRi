// Daily Insights: 7 days × 10 십성 (Ten Gods) = 70 messages × 3 languages
// dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday

export const DAILY_INSIGHTS: Record<number, Record<string, { ko: string; en: string; ja: string }>> = {
  1: { // Monday - 직업운 (Career)
    '비견': {
      ko: '동료와 시너지를 내면 좋은 한 주가 될 거예요. 혼자 하려 하지 말고 팀워크를 발휘하세요.',
      en: 'Teaming up with colleagues will make this a great week. Don\'t go solo — leverage teamwork.',
      ja: '同僚とシナジーを出せば良い一週間になります。一人でやろうとせず、チームワークを発揮しましょう。',
    },
    '겁재': {
      ko: '경쟁심이 올라오는 한 주. 남과 비교하기보다 내 페이스를 유지하세요.',
      en: 'A competitive week ahead. Focus on your own pace rather than comparing yourself to others.',
      ja: '競争心が高まる一週間。他人と比べるより、自分のペースを守りましょう。',
    },
    '식신': {
      ko: '이번 주는 아이디어가 빛나는 주. 회의에서 적극 발언하세요.',
      en: 'Your ideas will shine this week. Speak up actively in meetings.',
      ja: '今週はアイデアが光る週。会議で積極的に発言しましょう。',
    },
    '상관': {
      ko: '기존 방식에 의문이 드는 주. 개선안을 제시하되, 표현은 부드럽게 하세요.',
      en: 'You\'ll question existing methods this week. Suggest improvements, but keep your tone gentle.',
      ja: '既存のやり方に疑問を感じる週。改善案を出しつつも、表現は柔らかくしましょう。',
    },
    '편재': {
      ko: '다양한 업무가 동시에 들어올 수 있어요. 우선순위를 정해서 하나씩 처리하세요.',
      en: 'Multiple tasks may come in at once. Set priorities and tackle them one by one.',
      ja: '様々な業務が同時に入ってくるかも。優先順位を決めて一つずつ処理しましょう。',
    },
    '정재': {
      ko: '꾸준히 해온 일이 인정받는 주. 성실함이 빛을 발할 거예요.',
      en: 'Your consistent efforts will be recognized this week. Your diligence will pay off.',
      ja: 'コツコツやってきた仕事が認められる週。誠実さが光を放ちます。',
    },
    '편관': {
      ko: '책임이 커지는 한 주. 부담스럽지만 성장의 기회예요.',
      en: 'A week of growing responsibilities. It may feel heavy, but it\'s a chance to grow.',
      ja: '責任が大きくなる一週間。負担に感じますが、成長のチャンスです。',
    },
    '정관': {
      ko: '규칙과 절차를 잘 따르면 순조로운 한 주. 보고서 마감을 놓치지 마세요.',
      en: 'Following rules and procedures will ensure a smooth week. Don\'t miss any report deadlines.',
      ja: 'ルールと手続きを守れば順調な一週間。レポートの締め切りを逃さないように。',
    },
    '편인': {
      ko: '새로운 분야에 대한 호기심이 생기는 주. 온라인 강의나 세미나를 찾아보세요.',
      en: 'Curiosity about new fields will spark this week. Look into online courses or seminars.',
      ja: '新しい分野への好奇心が湧く週。オンライン講座やセミナーを探してみましょう。',
    },
    '정인': {
      ko: '윗사람의 조언이 큰 도움이 되는 주. 멘토에게 적극적으로 질문하세요.',
      en: 'Advice from seniors will be invaluable this week. Don\'t hesitate to ask your mentors questions.',
      ja: '上司や先輩のアドバイスが大きな助けになる週。メンターに積極的に質問しましょう。',
    },
  },

  2: { // Tuesday - 연애운 (Love)
    '비견': {
      ko: '연인과 대등한 관계가 중요한 날. 서로의 의견을 존중해 주세요.',
      en: 'An equal partnership matters today. Respect each other\'s opinions.',
      ja: '対等な関係が大切な日。お互いの意見を尊重しましょう。',
    },
    '겁재': {
      ko: '사소한 일로 다툴 수 있는 날. 양보하면 오히려 관계가 깊어져요.',
      en: 'Small things might cause arguments today. Giving in will actually deepen your bond.',
      ja: 'ささいなことで言い争いになりがちな日。譲れば、むしろ関係が深まります。',
    },
    '식신': {
      ko: '맛있는 음식을 함께 나누면 좋은 날. 새로운 맛집을 찾아보세요.',
      en: 'A great day to share a delicious meal together. Try finding a new restaurant.',
      ja: '美味しい食事を一緒に楽しむと良い日。新しいお店を探してみましょう。',
    },
    '상관': {
      ko: '솔직한 감정 표현이 통하는 날. 평소 못했던 말을 꺼내보세요.',
      en: 'Honest emotional expression will resonate today. Say what you\'ve been holding back.',
      ja: '素直な感情表現が伝わる日。普段言えなかったことを話してみましょう。',
    },
    '편재': {
      ko: '새로운 만남의 기회가 있는 날. 소개팅이나 모임에 적극적으로 참여하세요.',
      en: 'New romantic opportunities may appear today. Be open to introductions and gatherings.',
      ja: '新しい出会いのチャンスがある日。合コンや集まりに積極的に参加しましょう。',
    },
    '정재': {
      ko: '진심 어린 작은 선물이 큰 감동을 주는 날. 화려함보다 정성이 중요해요.',
      en: 'A small heartfelt gift will deeply touch them today. Sincerity matters more than extravagance.',
      ja: '心のこもった小さなプレゼントが大きな感動を与える日。派手さより真心が大切です。',
    },
    '편관': {
      ko: '밀고 당기기보다 직진하는 게 효과적인 날. 용기 내서 먼저 연락하세요.',
      en: 'Being direct is more effective than playing games today. Take courage and reach out first.',
      ja: '駆け引きより直球が効果的な日。勇気を出して先に連絡しましょう。',
    },
    '정관': {
      ko: '약속을 잘 지키는 모습이 신뢰를 쌓는 날. 시간 약속에 특히 신경 쓰세요.',
      en: 'Keeping promises builds trust today. Pay special attention to being on time.',
      ja: '約束を守る姿が信頼を築く日。時間の約束には特に気をつけましょう。',
    },
    '편인': {
      ko: '혼자만의 시간도 필요한 날. 연인에게 솔직히 말하면 이해해 줄 거예요.',
      en: 'You may need some alone time today. If you\'re honest about it, your partner will understand.',
      ja: '一人の時間も必要な日。恋人に正直に言えば理解してくれますよ。',
    },
    '정인': {
      ko: '따뜻한 말 한마디가 관계를 바꾸는 날. "고마워"라고 말해보세요.',
      en: 'A warm word can transform your relationship today. Try saying "thank you."',
      ja: '温かい一言が関係を変える日。「ありがとう」と言ってみましょう。',
    },
  },

  3: { // Wednesday - 재물운 (Wealth)
    '비견': {
      ko: '공동 투자보다는 단독 판단이 나은 날. 남의 말에 쉽게 흔들리지 마세요.',
      en: 'Solo decisions beat joint investments today. Don\'t be easily swayed by others\' opinions.',
      ja: '共同投資より単独判断が良い日。他人の言葉に簡単に揺らがないように。',
    },
    '겁재': {
      ko: '친구와의 금전 거래 주의. 빌려주면 돌아오기 어렵습니다.',
      en: 'Be cautious about money dealings with friends. Loans may not come back.',
      ja: '友人との金銭のやり取りに注意。貸したお金は戻りにくいです。',
    },
    '식신': {
      ko: '취미나 특기를 부업으로 연결할 아이디어가 떠오르는 날. 메모해 두세요.',
      en: 'Ideas for turning hobbies into side income may come to you today. Write them down.',
      ja: '趣味や特技を副業につなげるアイデアが浮かぶ日。メモしておきましょう。',
    },
    '상관': {
      ko: '충동구매 욕구가 강한 날. 장바구니에 넣고 하루만 기다려 보세요.',
      en: 'Impulse buying urges are strong today. Add to cart and wait a day before purchasing.',
      ja: '衝動買いの欲求が強い日。カートに入れて一日だけ待ってみましょう。',
    },
    '편재': {
      ko: '예상치 못한 수입이 들어올 수 있는 날. 다만 나간 것도 클 수 있으니 관리하세요.',
      en: 'Unexpected income may arrive today, but expenses could also be large. Manage carefully.',
      ja: '予想外の収入が入るかもしれない日。ただ出費も大きくなりえるので管理しましょう。',
    },
    '정재': {
      ko: '꾸준히 모아온 것의 성과가 보여요. 급하게 쓰지 마세요.',
      en: 'The results of your steady saving are showing. Don\'t spend hastily.',
      ja: 'コツコツ貯めてきた成果が見えてきます。急いで使わないようにしましょう。',
    },
    '편관': {
      ko: '세금이나 공과금 관련 체크가 필요한 날. 미루지 말고 오늘 처리하세요.',
      en: 'Check on taxes or bills today. Don\'t put it off — handle it now.',
      ja: '税金や公共料金の確認が必要な日。後回しにせず今日処理しましょう。',
    },
    '정관': {
      ko: '가계부 정리를 하면 좋은 날. 지출 패턴을 파악하면 절약 포인트가 보여요.',
      en: 'A great day to organize your budget. Understanding spending patterns reveals where to save.',
      ja: '家計簿の整理をすると良い日。支出パターンを把握すれば節約ポイントが見えます。',
    },
    '편인': {
      ko: '재테크 공부를 시작하기 좋은 날. 관련 책이나 유튜브를 찾아보세요.',
      en: 'A good day to start studying personal finance. Look into books or videos on the topic.',
      ja: '資産運用の勉強を始めるのに良い日。関連書籍やYouTubeを探してみましょう。',
    },
    '정인': {
      ko: '부모님이나 윗사람에게 재정 관련 조언을 구하면 도움이 되는 날이에요.',
      en: 'Seeking financial advice from parents or elders will be helpful today.',
      ja: '親や目上の人に財政面のアドバイスを求めると助けになる日です。',
    },
  },

  4: { // Thursday - 건강운 (Health)
    '비견': {
      ko: '친구와 함께 운동하면 효과가 두 배인 날. 러닝 메이트를 찾아보세요.',
      en: 'Working out with a friend doubles the effect today. Find a running buddy.',
      ja: '友達と一緒に運動すれば効果倍増の日。ランニング仲間を探してみましょう。',
    },
    '겁재': {
      ko: '무리한 운동은 부상으로 이어질 수 있어요. 욕심 내지 말고 적당히 하세요.',
      en: 'Overdoing exercise could lead to injury. Don\'t push too hard — moderation is key.',
      ja: '無理な運動はけがにつながるかも。欲張らず適度にしましょう。',
    },
    '식신': {
      ko: '식욕이 왕성한 날. 건강한 간식을 미리 준비해 두면 과식을 막을 수 있어요.',
      en: 'Your appetite will be strong today. Prepare healthy snacks in advance to avoid overeating.',
      ja: '食欲旺盛な日。ヘルシーな間食を事前に用意すれば食べ過ぎを防げます。',
    },
    '상관': {
      ko: '스트레스가 몸으로 나타날 수 있는 날. 명상이나 스트레칭으로 긴장을 풀어보세요.',
      en: 'Stress may manifest physically today. Try meditation or stretching to release tension.',
      ja: 'ストレスが体に出やすい日。瞑想やストレッチで緊張をほぐしましょう。',
    },
    '편재': {
      ko: '활동량이 많아지는 날. 수분 보충을 충분히 하고 중간중간 쉬세요.',
      en: 'An active day ahead. Stay well-hydrated and take breaks in between.',
      ja: '活動量が多くなる日。水分補給をしっかりして、合間に休憩を取りましょう。',
    },
    '정재': {
      ko: '규칙적인 생활 리듬이 건강의 핵심인 날. 같은 시간에 자고 일어나세요.',
      en: 'A regular daily rhythm is the key to health today. Go to bed and wake up at the same time.',
      ja: '規則正しい生活リズムが健康の鍵の日。同じ時間に寝て起きましょう。',
    },
    '편관': {
      ko: '미뤄왔던 건강검진을 예약하기 좋은 날. 예방이 최고의 치료입니다.',
      en: 'A good day to schedule that health checkup you\'ve been putting off. Prevention is the best cure.',
      ja: '先延ばしにしていた健康診断を予約するのに良い日。予防が最良の治療です。',
    },
    '정관': {
      ko: '정해진 루틴을 따르면 컨디션이 좋아지는 날. 오늘은 계획대로 움직여 보세요.',
      en: 'Following your routine will boost your condition today. Stick to the plan.',
      ja: '決まったルーティンに従えばコンディションが良くなる日。今日は計画通りに動きましょう。',
    },
    '편인': {
      ko: '새로운 건강법을 시도해 보기 좋은 날. 요가나 필라테스 체험을 추천해요.',
      en: 'A great day to try a new wellness practice. Consider a yoga or pilates trial class.',
      ja: '新しい健康法を試してみるのに良い日。ヨガやピラティスの体験をおすすめします。',
    },
    '정인': {
      ko: '충분한 수면이 보약인 날. 오늘은 일찍 잠자리에 들어보세요.',
      en: 'Plenty of sleep is the best medicine today. Try getting to bed early tonight.',
      ja: '十分な睡眠が最良の薬の日。今日は早めに床につきましょう。',
    },
  },

  5: { // Friday - 대인관계 (Social / Relationships)
    '비견': {
      ko: '비슷한 관심사를 가진 사람과 의기투합하는 날. 동호회나 커뮤니티 활동을 추천해요.',
      en: 'You\'ll click with someone who shares your interests today. Try a club or community activity.',
      ja: '似た趣味を持つ人と意気投合する日。サークルやコミュニティ活動がおすすめです。',
    },
    '겁재': {
      ko: '경쟁심이 인간관계를 해칠 수 있는 날. 이기려 하기보다 함께 즐기세요.',
      en: 'Competitiveness could harm relationships today. Enjoy the moment together instead of trying to win.',
      ja: '競争心が人間関係を損なう可能性がある日。勝とうとするより一緒に楽しみましょう。',
    },
    '식신': {
      ko: '사람들과 어울리면 에너지를 받는 날. 회식이나 모임에 적극 참여하세요.',
      en: 'Socializing will energize you today. Actively join dinner gatherings or meetups.',
      ja: '人と交わるとエネルギーをもらえる日。飲み会や集まりに積極的に参加しましょう。',
    },
    '상관': {
      ko: '솔직한 말이 오해를 부를 수 있는 날. 말하기 전에 한 번 더 생각하세요.',
      en: 'Blunt honesty could cause misunderstandings today. Think twice before speaking.',
      ja: '率直な言葉が誤解を招くかもしれない日。話す前にもう一度考えましょう。',
    },
    '편재': {
      ko: '다양한 사람을 만나기 좋은 날. 네트워킹 자리에서 좋은 인연을 만날 수 있어요.',
      en: 'A great day to meet diverse people. Networking events could bring valuable connections.',
      ja: '様々な人に会うのに良い日。ネットワーキングの場で良い縁に出会えるかも。',
    },
    '정재': {
      ko: '오래된 친구에게 연락하면 반가워할 거예요. 안부 메시지를 보내보세요.',
      en: 'An old friend would love to hear from you. Send them a message today.',
      ja: '昔の友達に連絡すれば喜ばれますよ。安否のメッセージを送ってみましょう。',
    },
    '편관': {
      ko: '리더십을 발휘해야 하는 자리가 생길 수 있어요. 자신감 있게 의견을 이끌어 보세요.',
      en: 'A leadership opportunity may come up. Confidently take the lead and share your views.',
      ja: 'リーダーシップを発揮する場面が出てくるかも。自信を持って意見をリードしましょう。',
    },
    '정관': {
      ko: '예의 바른 행동이 좋은 인상을 남기는 날. 감사 인사를 빠뜨리지 마세요.',
      en: 'Polite behavior will leave a great impression today. Don\'t forget to express gratitude.',
      ja: '礼儀正しい行動が好印象を残す日。感謝の挨拶を忘れずに。',
    },
    '편인': {
      ko: '혼자 있고 싶은 마음이 드는 날. 짧은 시간이라도 나만의 시간을 확보하세요.',
      en: 'You may crave solitude today. Carve out some personal time, even if it\'s brief.',
      ja: '一人になりたい気持ちが出てくる日。短い時間でも自分だけの時間を確保しましょう。',
    },
    '정인': {
      ko: '어른이나 선배의 모임에 참석하면 귀한 조언을 들을 수 있는 날이에요.',
      en: 'Attending gatherings with elders or seniors could bring precious advice today.',
      ja: '年長者や先輩の集まりに出席すれば貴重なアドバイスが聞ける日です。',
    },
  },

  6: { // Saturday - 행운팁 (Lucky Tips)
    '비견': {
      ko: '같은 띠나 같은 해에 태어난 친구와 함께하면 행운이 따라와요.',
      en: 'Spending time with a friend born in the same zodiac year brings luck today.',
      ja: '同じ干支や同じ年に生まれた友達と一緒にいると幸運がついてきます。',
    },
    '겁재': {
      ko: '오늘의 행운 색은 파란색. 파란 계열 소품을 하나 지니고 다녀보세요.',
      en: 'Your lucky color today is blue. Carry a blue accessory with you.',
      ja: '今日のラッキーカラーは青。青系の小物を一つ持ち歩いてみましょう。',
    },
    '식신': {
      ko: '새로운 음식을 먹으면 좋은 기운이 들어와요. 안 가본 식당에 도전해 보세요.',
      en: 'Trying new food brings good energy. Visit a restaurant you haven\'t been to before.',
      ja: '新しい食べ物を食べると良い気が入ってきます。行ったことのないお店に挑戦してみましょう。',
    },
    '상관': {
      ko: '창작 활동이 행운을 불러오는 날. 글쓰기, 그림, 음악 등 표현해 보세요.',
      en: 'Creative activities bring luck today. Try writing, drawing, or making music.',
      ja: '創作活動が幸運を呼ぶ日。文章、絵、音楽など表現してみましょう。',
    },
    '편재': {
      ko: '평소 안 가던 방향으로 산책하면 뜻밖의 발견이 있을 거예요.',
      en: 'Walking in an unfamiliar direction may lead to a pleasant surprise.',
      ja: 'いつもと違う方向に散歩すると思わぬ発見がありますよ。',
    },
    '정재': {
      ko: '정리정돈이 행운을 부르는 날. 지갑 속을 깔끔히 정리해 보세요.',
      en: 'Tidying up brings luck today. Clean out your wallet and organize it neatly.',
      ja: '整理整頓が幸運を呼ぶ日。お財布の中をきれいに整理してみましょう。',
    },
    '편관': {
      ko: '일찍 일어나면 좋은 일이 생기는 날. 아침 공기를 마시며 산책해 보세요.',
      en: 'Good things come to early risers today. Take a walk and breathe in the morning air.',
      ja: '早起きすると良いことがある日。朝の空気を吸いながら散歩してみましょう。',
    },
    '정관': {
      ko: '오늘의 행운 숫자는 8. 중요한 선택이 있다면 8과 관련된 것을 골라보세요.',
      en: 'Your lucky number today is 8. If making a choice, go with something related to 8.',
      ja: '今日のラッキーナンバーは8。大事な選択があれば8に関連するものを選んでみましょう。',
    },
    '편인': {
      ko: '서점이나 도서관에 가면 영감을 주는 책을 만날 수 있는 날이에요.',
      en: 'Visiting a bookstore or library may lead you to an inspiring book today.',
      ja: '書店や図書館に行くとインスピレーションを与える本に出会える日です。',
    },
    '정인': {
      ko: '감사 일기를 쓰면 좋은 기운이 모이는 날. 오늘 고마웠던 세 가지를 적어보세요.',
      en: 'Writing a gratitude journal attracts good energy today. List three things you\'re thankful for.',
      ja: '感謝日記を書くと良い気が集まる日。今日ありがたかったことを三つ書いてみましょう。',
    },
  },

  0: { // Sunday - 주간총정리 (Weekly Summary)
    '비견': {
      ko: '이번 주 나와 함께한 사람들을 떠올려 보세요. 감사의 마음이 다음 주를 밝게 해줘요.',
      en: 'Think about the people who were with you this week. Gratitude will brighten next week.',
      ja: '今週一緒にいた人たちを思い浮かべましょう。感謝の気持ちが来週を明るくしてくれます。',
    },
    '겁재': {
      ko: '이번 주 감정이 요동쳤다면 일기를 써보세요. 다음 주는 더 차분하게 시작할 수 있어요.',
      en: 'If emotions ran high this week, try journaling. It\'ll help you start next week more calmly.',
      ja: '今週感情が揺れたなら日記を書いてみましょう。来週はもっと穏やかに始められますよ。',
    },
    '식신': {
      ko: '이번 주 잘 먹고 잘 쉬었나요? 다음 주를 위해 오늘은 충분히 쉬어가세요.',
      en: 'Did you eat well and rest this week? Take today to fully recharge for next week.',
      ja: '今週よく食べてよく休めましたか？来週のために今日は十分に休みましょう。',
    },
    '상관': {
      ko: '이번 주 후회되는 말이 있다면, 다음 주엔 한 박자 늦게 말하는 연습을 해보세요.',
      en: 'If you regret something you said this week, practice pausing before speaking next week.',
      ja: '今週後悔した言葉があれば、来週はワンテンポ遅く話す練習をしてみましょう。',
    },
    '편재': {
      ko: '이번 주 수입과 지출을 점검해 보세요. 흐름을 파악하면 다음 주가 편해져요.',
      en: 'Review your income and expenses this week. Understanding the flow makes next week easier.',
      ja: '今週の収入と支出を確認してみましょう。お金の流れを把握すれば来週が楽になります。',
    },
    '정재': {
      ko: '이번 주 목표한 것을 체크해 보세요. 작은 달성이라도 스스로를 칭찬해 주세요.',
      en: 'Check off this week\'s goals. Even small achievements deserve self-praise.',
      ja: '今週の目標を確認してみましょう。小さな達成でも自分を褒めてあげましょう。',
    },
    '편관': {
      ko: '이번 주 도전적인 일이 있었다면 잘 버텨낸 자신을 대견하게 여기세요.',
      en: 'If you faced challenges this week, be proud of yourself for getting through them.',
      ja: '今週挑戦的なことがあったなら、よく頑張った自分を誇りに思いましょう。',
    },
    '정관': {
      ko: '다음 주 스케줄을 미리 정리해 두면 월요일이 한결 수월해요.',
      en: 'Organizing next week\'s schedule now will make Monday much smoother.',
      ja: '来週のスケジュールを先に整理しておけば月曜日がずっと楽になりますよ。',
    },
    '편인': {
      ko: '이번 주 새롭게 배운 것이 있다면 메모로 남겨두세요. 나중에 큰 자산이 돼요.',
      en: 'If you learned something new this week, jot it down. It\'ll become a valuable asset later.',
      ja: '今週新しく学んだことがあればメモに残しましょう。後で大きな財産になりますよ。',
    },
    '정인': {
      ko: '이번 주 도움을 준 사람에게 감사 메시지를 보내보세요. 따뜻한 마무리가 좋은 시작이 돼요.',
      en: 'Send a thank-you message to someone who helped you this week. A warm ending makes a great start.',
      ja: '今週助けてくれた人に感謝のメッセージを送りましょう。温かい締めくくりが良いスタートになります。',
    },
  },
};
