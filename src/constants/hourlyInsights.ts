/**
 * Hourly Insights: 12 시진 (Chinese double-hours) × 10 십성 (Ten Gods) = 120 messages
 *
 * 시진 (時辰):
 *   자시(子時) 23:00–01:00, 축시(丑時) 01:00–03:00, 인시(寅時) 03:00–05:00,
 *   묘시(卯時) 05:00–07:00, 진시(辰時) 07:00–09:00, 사시(巳時) 09:00–11:00,
 *   오시(午時) 11:00–13:00, 미시(未時) 13:00–15:00, 신시(申時) 15:00–17:00,
 *   유시(酉時) 17:00–19:00, 술시(戌時) 19:00–21:00, 해시(亥時) 21:00–23:00
 *
 * 십성 (十星 / Ten Gods):
 *   비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인
 */

export const HOURLY_INSIGHTS: Record<string, Record<string, { ko: string; en: string; ja: string }>> = {
  // ──────────────────────────────────────────────
  // 자시 (子時) 23:00–01:00
  // ──────────────────────────────────────────────
  '자시': {
    '비견': {
      ko: '같은 뜻을 가진 사람을 만날 수 있는 시간입니다. 밤늦게 연락이 온다면 귀 기울여 보세요.',
      en: 'A time to meet like-minded people. If someone reaches out late at night, pay attention.',
      ja: '同じ志を持つ人に出会える時間です。夜遅くに連絡が来たら耳を傾けてみましょう。',
    },
    '겁재': {
      ko: '늦은 밤 충동적인 소비를 조심하세요. 내일 다시 생각해도 늦지 않습니다.',
      en: 'Watch out for impulsive late-night spending. Sleeping on it is always a good idea.',
      ja: '夜遅くの衝動買いに注意しましょう。明日もう一度考えても遅くはありません。',
    },
    '식신': {
      ko: '아이디어가 떠오르는 시간입니다. 떠오르는 생각을 메모해 두세요.',
      en: 'Ideas are flowing — grab your phone and take notes before they slip away.',
      ja: 'アイデアが浮かぶ時間です。思いついたことをメモしておきましょう。',
    },
    '상관': {
      ko: '밤의 고요함 속에서 솔직한 감정이 올라옵니다. 감정적인 메시지는 보내지 말고 일기장에 적어 보세요.',
      en: 'Raw emotions surface in the quiet of night. Write in a journal instead of sending that message.',
      ja: '夜の静けさの中で素直な感情が湧き上がります。感情的なメッセージは送らず、日記に書いてみましょう。',
    },
    '편재': {
      ko: '밤늦은 시간, 재테크 관련 정보를 정리해 보세요. 새로운 투자 아이디어가 떠오를 수 있습니다.',
      en: 'A good time to review your finances quietly. A fresh investment idea might come to mind.',
      ja: '夜遅い時間、資産運用の情報を整理してみましょう。新しい投資アイデアが浮かぶかもしれません。',
    },
    '정재': {
      ko: '하루의 지출을 정리하기 좋은 시간입니다. 가계부를 간단히 적어 보세요.',
      en: 'A perfect moment to review today\'s spending. Jot down a quick budget note.',
      ja: '一日の支出を整理するのに良い時間です。家計簿を簡単につけてみましょう。',
    },
    '편관': {
      ko: '긴장을 풀고 쉬어야 할 시간입니다. 내일의 도전을 위해 체력을 아껴 두세요.',
      en: 'Time to unwind. Save your energy for tomorrow\'s challenges.',
      ja: '緊張を解いて休むべき時間です。明日の挑戦のために体力を温存しましょう。',
    },
    '정관': {
      ko: '내일 해야 할 일을 간단히 정리해 두면 아침이 한결 수월해집니다.',
      en: 'Quickly plan tomorrow\'s tasks — your morning self will thank you.',
      ja: '明日やるべきことを簡単に整理しておくと、朝がずっと楽になります。',
    },
    '편인': {
      ko: '잠들기 전 짧은 독서가 좋은 영감을 줄 수 있습니다. 가볍게 한 챕터 읽어 보세요.',
      en: 'A short read before bed can spark great inspiration. Try one chapter of something light.',
      ja: '寝る前の短い読書が良いインスピレーションを与えてくれます。軽く一章読んでみましょう。',
    },
    '정인': {
      ko: '조용한 밤, 자기 성찰의 시간을 가져 보세요. 오늘 배운 것을 되새기면 내일이 달라집니다.',
      en: 'Use the quiet night for self-reflection. Reviewing what you learned today shapes a better tomorrow.',
      ja: '静かな夜、自己省察の時間を持ちましょう。今日学んだことを振り返ると明日が変わります。',
    },
  },

  // ──────────────────────────────────────────────
  // 축시 (丑時) 01:00–03:00
  // ──────────────────────────────────────────────
  '축시': {
    '비견': {
      ko: '이 시간까지 깨어 있다면 같은 고민을 하는 동료가 있을 수 있습니다. 내일 대화를 나눠 보세요.',
      en: 'If you\'re still awake, a colleague may share your worries. Reach out tomorrow for a chat.',
      ja: 'この時間まで起きているなら、同じ悩みを持つ仲間がいるかもしれません。明日話してみましょう。',
    },
    '겁재': {
      ko: '새벽 시간의 판단은 흐려지기 쉽습니다. 중요한 결정은 내일로 미루세요.',
      en: 'Judgment gets cloudy in the wee hours. Postpone any big decisions until tomorrow.',
      ja: '深夜の判断は鈍りがちです。大事な決断は明日に延ばしましょう。',
    },
    '식신': {
      ko: '깊은 밤에 떠오른 창의적 아이디어를 놓치지 마세요. 음성 메모로 남겨 두면 편합니다.',
      en: 'Don\'t lose those creative sparks — record a quick voice memo to capture them.',
      ja: '深夜に浮かんだクリエイティブなアイデアを逃さないで。音声メモで残しておくと便利です。',
    },
    '상관': {
      ko: '감정이 예민해지기 쉬운 시간입니다. SNS를 잠시 내려놓고 마음을 가라앉혀 보세요.',
      en: 'Emotions run high at this hour. Put down social media and let your mind settle.',
      ja: '感情が敏感になりやすい時間です。SNSをしばらく置いて、心を落ち着けましょう。',
    },
    '편재': {
      ko: '해외 시장의 움직임을 살펴보기 좋은 시간입니다. 관심 있는 종목을 체크해 보세요.',
      en: 'A good window to check overseas market movements. Review stocks on your watchlist.',
      ja: '海外市場の動きをチェックするのに良い時間です。気になる銘柄を確認してみましょう。',
    },
    '정재': {
      ko: '안정적인 저축 계획을 떠올려 보세요. 잠들기 전 자동이체 설정을 확인하는 것도 좋습니다.',
      en: 'Think about your savings plan. Double-check your automatic transfers before sleeping.',
      ja: '安定した貯蓄計画を考えてみましょう。寝る前に自動振替の設定を確認するのも良いです。',
    },
    '편관': {
      ko: '수면이 부족하면 내일 집중력이 떨어집니다. 지금 자리에 누우세요.',
      en: 'Sleep deprivation kills focus. Get to bed now — tomorrow needs you sharp.',
      ja: '睡眠不足だと明日の集中力が落ちます。今すぐ横になりましょう。',
    },
    '정관': {
      ko: '규칙적인 수면 습관이 성공의 기초입니다. 이 시간에는 잠자리에 드는 것이 좋습니다.',
      en: 'Consistent sleep habits are the foundation of success. This is your cue to rest.',
      ja: '規則正しい睡眠習慣が成功の基礎です。この時間には就寝するのがベストです。',
    },
    '편인': {
      ko: '깊은 밤의 사색이 내일의 통찰로 이어질 수 있습니다. 하지만 무리하지 말고 쉬세요.',
      en: 'Late-night contemplation can yield tomorrow\'s insight, but don\'t overdo it — rest up.',
      ja: '深夜の思索が明日の洞察につながることも。でも無理せず休みましょう。',
    },
    '정인': {
      ko: '자기 전 감사한 일 세 가지를 떠올려 보세요. 작은 습관이 마음의 평안을 가져다줍니다.',
      en: 'Think of three things you\'re grateful for before sleep. Small habits bring great peace.',
      ja: '寝る前に感謝できることを三つ思い浮かべてみましょう。小さな習慣が心の安らぎをもたらします。',
    },
  },

  // ──────────────────────────────────────────────
  // 인시 (寅時) 03:00–05:00
  // ──────────────────────────────────────────────
  '인시': {
    '비견': {
      ko: '새벽에 함께 운동하는 동료를 만들면 꾸준함이 생깁니다. 러닝 메이트를 찾아보세요.',
      en: 'An early-morning workout partner keeps you consistent. Look for a running buddy.',
      ja: '早朝に一緒に運動する仲間を作ると続けられます。ランニング仲間を探してみましょう。',
    },
    '겁재': {
      ko: '이른 새벽의 에너지를 경쟁심으로 쓰지 마세요. 자신과의 싸움에 집중하세요.',
      en: 'Don\'t channel early-morning energy into rivalry. Focus on competing with yourself.',
      ja: '早朝のエネルギーを競争心に使わないで。自分との戦いに集中しましょう。',
    },
    '식신': {
      ko: '새벽의 고요한 시간은 글쓰기나 창작에 최적입니다. 영감이 샘솟는 시간이에요.',
      en: 'The pre-dawn quiet is perfect for writing or creating. Inspiration wells up naturally.',
      ja: '夜明け前の静かな時間は執筆や創作に最適です。インスピレーションが湧き出る時間です。',
    },
    '상관': {
      ko: '새벽에 느끼는 불안감은 과장되기 쉽습니다. 깊게 호흡하고 몸을 움직여 보세요.',
      en: 'Pre-dawn anxiety tends to feel bigger than it is. Breathe deeply and move your body.',
      ja: '夜明け前に感じる不安は大げさになりがちです。深呼吸して体を動かしてみましょう。',
    },
    '편재': {
      ko: '새벽 시간을 활용해 부업이나 사이드 프로젝트를 진행해 보세요. 방해 없이 집중할 수 있습니다.',
      en: 'Use these early hours for a side project. Zero distractions, maximum focus.',
      ja: '早朝の時間を活用して副業やサイドプロジェクトを進めてみましょう。邪魔なく集中できます。',
    },
    '정재': {
      ko: '아침 루틴을 정비하기 좋은 시간입니다. 절약 습관도 루틴에 포함시켜 보세요.',
      en: 'Great time to refine your morning routine. Add a small saving habit into the mix.',
      ja: '朝のルーティンを整えるのに良い時間です。節約の習慣もルーティンに入れてみましょう。',
    },
    '편관': {
      ko: '일찍 일어났다면 하루의 전략을 세워 보세요. 선제적으로 움직이면 주도권을 잡을 수 있습니다.',
      en: 'If you\'re up early, strategize your day. Taking initiative gives you the upper hand.',
      ja: '早起きしたなら一日の戦略を立てましょう。先手を打てば主導権を握れます。',
    },
    '정관': {
      ko: '새벽 기상은 자기 관리의 시작입니다. 오늘 하루 목표를 세 가지만 정해 보세요.',
      en: 'Waking at dawn is where self-discipline starts. Set just three goals for today.',
      ja: '早起きは自己管理の始まりです。今日の目標を三つだけ決めてみましょう。',
    },
    '편인': {
      ko: '새벽의 조용한 시간에 명상이나 요가를 해 보세요. 하루를 여는 에너지가 달라집니다.',
      en: 'Try meditation or yoga in the pre-dawn stillness. It changes how you start the day.',
      ja: '夜明け前の静かな時間に瞑想やヨガをしてみましょう。一日を始めるエネルギーが変わります。',
    },
    '정인': {
      ko: '이른 아침 독서는 하루의 질을 높여줍니다. 좋아하는 책을 한 페이지라도 읽어 보세요.',
      en: 'Early-morning reading elevates your whole day. Even one page of a favorite book helps.',
      ja: '早朝の読書は一日の質を高めてくれます。好きな本を一ページでも読んでみましょう。',
    },
  },

  // ──────────────────────────────────────────────
  // 묘시 (卯時) 05:00–07:00
  // ──────────────────────────────────────────────
  '묘시': {
    '비견': {
      ko: '아침 산책에서 이웃을 만나면 가볍게 인사해 보세요. 뜻밖의 인연이 시작될 수 있습니다.',
      en: 'Greet your neighbors on a morning walk. An unexpected connection may begin.',
      ja: '朝の散歩でご近所さんに会ったら軽く挨拶してみましょう。思わぬ縁が始まるかもしれません。',
    },
    '겁재': {
      ko: '아침부터 남과 비교하지 마세요. 나만의 페이스로 하루를 시작하는 것이 중요합니다.',
      en: 'Don\'t compare yourself to others first thing. Start the day at your own pace.',
      ja: '朝から人と比べないで。自分のペースで一日を始めることが大切です。',
    },
    '식신': {
      ko: '균형 잡힌 아침 식사가 오늘의 컨디션을 좌우합니다. 간단하더라도 꼭 드세요.',
      en: 'A balanced breakfast sets the tone for your day. Even something simple counts.',
      ja: 'バランスの取れた朝食が今日のコンディションを左右します。簡単でも必ず食べましょう。',
    },
    '상관': {
      ko: '아침에 떠오른 감정을 솔직하게 일기에 적어 보세요. 하루의 방향이 명확해집니다.',
      en: 'Write down your morning feelings honestly. It clarifies the direction of your day.',
      ja: '朝に浮かんだ感情を素直に日記に書いてみましょう。一日の方向性が明確になります。',
    },
    '편재': {
      ko: '출근 전 경제 뉴스를 간단히 체크해 보세요. 오늘의 기회를 미리 파악할 수 있습니다.',
      en: 'Scan the financial news before heading out. Spot today\'s opportunities early.',
      ja: '出勤前に経済ニュースを簡単にチェックしてみましょう。今日のチャンスを事前に把握できます。',
    },
    '정재': {
      ko: '오늘 하루 예산을 미리 정해 두면 불필요한 지출을 막을 수 있습니다.',
      en: 'Set a daily budget before you head out — it prevents unnecessary spending.',
      ja: '今日一日の予算をあらかじめ決めておくと、無駄な出費を防げます。',
    },
    '편관': {
      ko: '아침에 가벼운 운동으로 몸을 깨워 보세요. 오늘의 도전에 대비하는 힘이 생깁니다.',
      en: 'Wake your body with light exercise. It builds strength for today\'s challenges.',
      ja: '朝に軽い運動で体を目覚めさせましょう。今日の挑戦に備える力が生まれます。',
    },
    '정관': {
      ko: '출근 준비를 여유 있게 하면 하루 전체의 리듬이 안정됩니다. 서두르지 마세요.',
      en: 'A calm morning routine steadies the rhythm of your entire day. Don\'t rush.',
      ja: '出勤準備をゆとりを持ってすると、一日全体のリズムが安定します。焦らないで。',
    },
    '편인': {
      ko: '아침 햇살을 받으며 잠시 생각을 정리해 보세요. 직감이 또렷해지는 시간입니다.',
      en: 'Gather your thoughts in the morning sunlight. Your intuition sharpens at this hour.',
      ja: '朝日を浴びながら少し考えを整理してみましょう。直感が冴える時間です。',
    },
    '정인': {
      ko: '아침에 가족이나 가까운 사람에게 따뜻한 말 한마디를 건네 보세요. 서로의 하루가 밝아집니다.',
      en: 'Share a kind word with family or loved ones this morning. It brightens everyone\'s day.',
      ja: '朝に家族や親しい人に温かい一言をかけてみましょう。お互いの一日が明るくなります。',
    },
  },

  // ──────────────────────────────────────────────
  // 진시 (辰時) 07:00–09:00
  // ──────────────────────────────────────────────
  '진시': {
    '비견': {
      ko: '출근길에 만나는 사람들 속에서 협력할 파트너를 발견할 수 있습니다. 열린 마음을 가지세요.',
      en: 'You might spot a potential collaborator on your commute. Keep an open mind.',
      ja: '通勤中に出会う人の中に協力できるパートナーがいるかもしれません。心を開いていましょう。',
    },
    '겁재': {
      ko: '아침 회의에서 자기 주장만 내세우지 마세요. 양보하면 더 큰 것을 얻을 수 있습니다.',
      en: 'Don\'t dominate the morning meeting. Yielding a little can win you much more.',
      ja: '朝の会議で自分の主張ばかり通そうとしないで。譲ればもっと大きなものが得られます。',
    },
    '식신': {
      ko: '출근 직후의 맑은 정신으로 기획안이나 보고서 초안을 작성해 보세요.',
      en: 'Use your fresh morning mind to draft that proposal or report.',
      ja: '出勤直後のクリアな頭で企画書やレポートの草案を書いてみましょう。',
    },
    '상관': {
      ko: '아침에 비판적인 말은 삼가세요. 건설적인 피드백으로 바꿔 전달하면 관계가 좋아집니다.',
      en: 'Hold back on criticism this morning. Reframe it as constructive feedback for better results.',
      ja: '朝に批判的な言葉は控えましょう。建設的なフィードバックに変えて伝えると関係が良くなります。',
    },
    '편재': {
      ko: '오전에 새로운 비즈니스 기회를 적극적으로 탐색해 보세요. 행동이 빠를수록 유리합니다.',
      en: 'Actively explore new business opportunities this morning. Speed is your advantage.',
      ja: '午前中に新しいビジネスチャンスを積極的に探してみましょう。行動が早いほど有利です。',
    },
    '정재': {
      ko: '정기적인 저축이나 보험료 납부 일정을 확인하세요. 작은 관리가 큰 안정으로 이어집니다.',
      en: 'Check your regular savings or insurance payment schedules. Small management leads to big stability.',
      ja: '定期的な貯蓄や保険料の支払いスケジュールを確認しましょう。小さな管理が大きな安定につながります。',
    },
    '편관': {
      ko: '아침에 어려운 업무를 먼저 처리하세요. 가장 힘든 일을 먼저 하면 나머지가 수월해집니다.',
      en: 'Tackle the hardest task first thing. Everything else feels easier after that.',
      ja: '朝に難しい仕事を先に片付けましょう。一番大変なことを先にやれば残りが楽になります。',
    },
    '정관': {
      ko: '오전 업무 시작 전, 오늘의 우선순위를 명확히 정리하세요. 체계적인 하루가 됩니다.',
      en: 'Clarify your priorities before diving into work. A structured start makes a structured day.',
      ja: '午前の業務開始前に今日の優先順位を明確に整理しましょう。体系的な一日になります。',
    },
    '편인': {
      ko: '출근길에 팟캐스트나 오디오북을 들어 보세요. 이동 시간이 학습 시간으로 바뀝니다.',
      en: 'Listen to a podcast or audiobook on your commute. Turn travel time into learning time.',
      ja: '通勤中にポッドキャストやオーディオブックを聴いてみましょう。移動時間が学習時間に変わります。',
    },
    '정인': {
      ko: '아침에 감사의 마음으로 하루를 시작하면 긍정적인 에너지가 따라옵니다.',
      en: 'Starting the morning with gratitude invites positive energy throughout the day.',
      ja: '朝に感謝の気持ちで一日を始めるとポジティブなエネルギーがついてきます。',
    },
  },

  // ──────────────────────────────────────────────
  // 사시 (巳時) 09:00–11:00
  // ──────────────────────────────────────────────
  '사시': {
    '비견': {
      ko: '동료와 아이디어를 나누면 시너지가 생깁니다. 브레인스토밍을 제안해 보세요.',
      en: 'Sharing ideas with colleagues creates synergy. Suggest a brainstorming session.',
      ja: '同僚とアイデアを共有するとシナジーが生まれます。ブレインストーミングを提案してみましょう。',
    },
    '겁재': {
      ko: '오전 회의에서 공을 독차지하지 마세요. 팀의 성과로 인정하면 신뢰가 쌓입니다.',
      en: 'Don\'t hog the credit in the morning meeting. Sharing praise builds team trust.',
      ja: '午前の会議で手柄を独り占めしないで。チームの成果として認めると信頼が積まれます。',
    },
    '식신': {
      ko: '오전의 집중력이 가장 높은 시간입니다. 창의적인 업무를 지금 처리하세요.',
      en: 'Your focus peaks in the late morning. Tackle creative work right now.',
      ja: '午前の集中力が最も高い時間です。クリエイティブな仕事を今処理しましょう。',
    },
    '상관': {
      ko: '날카로운 의견은 가치가 있지만, 전달 방식이 중요합니다. 부드럽게 말해 보세요.',
      en: 'Sharp opinions have value, but delivery matters. Choose your words gently.',
      ja: '鋭い意見には価値がありますが、伝え方が重要です。柔らかく話してみましょう。',
    },
    '편재': {
      ko: '오전 중에 거래처나 클라이언트에게 연락해 보세요. 새로운 수익 기회가 열릴 수 있습니다.',
      en: 'Reach out to clients or partners this morning. A new revenue opportunity may open up.',
      ja: '午前中に取引先やクライアントに連絡してみましょう。新しい収益チャンスが開けるかもしれません。',
    },
    '정재': {
      ko: '계약서나 중요 서류를 꼼꼼히 확인하기 좋은 시간입니다. 세부 사항을 놓치지 마세요.',
      en: 'A great time to review contracts or important documents. Don\'t miss the fine print.',
      ja: '契約書や重要書類をしっかり確認するのに良い時間です。細部を見逃さないで。',
    },
    '편관': {
      ko: '상사나 윗사람의 지시를 정확히 파악하세요. 이해가 안 되면 바로 질문하는 것이 낫습니다.',
      en: 'Make sure you clearly understand your supervisor\'s instructions. Ask immediately if unsure.',
      ja: '上司や目上の人の指示を正確に把握しましょう。分からなければすぐ質問するのがベストです。',
    },
    '정관': {
      ko: '업무에 집중하고 책임감 있게 처리하세요. 오전의 성실한 태도가 하루 전체의 성과를 좌우합니다.',
      en: 'Focus on work responsibilities now. A diligent morning attitude shapes the whole day\'s results.',
      ja: '仕事に集中して責任感を持って処理しましょう。午前の誠実な姿勢が一日全体の成果を左右します。',
    },
    '편인': {
      ko: '업무 중 막히는 부분이 있다면 잠시 다른 시각으로 접근해 보세요. 의외의 해결책이 보일 수 있습니다.',
      en: 'If you\'re stuck at work, try a different angle. An unexpected solution may appear.',
      ja: '仕事中に行き詰まったら、少し違う視点からアプローチしてみましょう。意外な解決策が見えるかもしれません。',
    },
    '정인': {
      ko: '오전에 멘토나 선배에게 짧은 안부를 전해 보세요. 소중한 조언을 받을 수 있습니다.',
      en: 'Send a brief check-in to a mentor or senior colleague. Valuable advice may follow.',
      ja: '午前中にメンターや先輩に短い挨拶を送ってみましょう。貴重なアドバイスがもらえるかもしれません。',
    },
  },

  // ──────────────────────────────────────────────
  // 오시 (午時) 11:00–13:00
  // ──────────────────────────────────────────────
  '오시': {
    '비견': {
      ko: '점심시간에 동료와 함께 식사하며 유대감을 쌓아 보세요. 가벼운 대화가 큰 힘이 됩니다.',
      en: 'Have lunch with a colleague and build rapport. Light conversation can be powerful.',
      ja: 'ランチタイムに同僚と一緒に食事をして絆を深めましょう。軽い会話が大きな力になります。',
    },
    '겁재': {
      ko: '점심에 과식하지 마세요. 오후 집중력을 위해 적당히 드시는 게 좋습니다.',
      en: 'Don\'t overeat at lunch. A moderate meal keeps your afternoon focus sharp.',
      ja: 'ランチで食べ過ぎないで。午後の集中力のために適度に食べるのが良いです。',
    },
    '식신': {
      ko: '점심 메뉴를 새로운 곳에서 도전해 보세요. 새로운 맛이 기분 전환이 됩니다.',
      en: 'Try a new lunch spot today. A change of flavor refreshes your mood.',
      ja: 'ランチメニューを新しいお店で挑戦してみましょう。新しい味が気分転換になります。',
    },
    '상관': {
      ko: '점심시간에 감정적인 대화는 피하세요. 가벼운 주제로 분위기를 밝게 유지하는 것이 좋습니다.',
      en: 'Avoid heavy emotional topics at lunch. Keep things light and the mood will stay bright.',
      ja: 'ランチタイムに感情的な会話は避けましょう。軽い話題で雰囲気を明るく保つのが良いです。',
    },
    '편재': {
      ko: '점심시간 충동 구매를 조심하세요. 오후에 예상치 못한 지출이 생길 수 있습니다.',
      en: 'Watch your spending at lunch — unexpected expenses could pop up this afternoon.',
      ja: 'ランチタイムの衝動買いに注意しましょう。午後に予想外の出費があるかもしれません。',
    },
    '정재': {
      ko: '점심시간을 활용해 재정 계획을 점검해 보세요. 월말 지출 정리를 미리 시작하면 좋습니다.',
      en: 'Use your lunch break to review financial plans. Getting ahead on month-end budgeting pays off.',
      ja: 'ランチタイムを活用して財務計画を点検しましょう。月末の支出整理を早めに始めると良いです。',
    },
    '편관': {
      ko: '오후 업무에 대비해 점심시간에 잠시 산책하세요. 머리가 맑아지고 체력이 회복됩니다.',
      en: 'Take a short walk at lunch to prep for the afternoon. It clears your mind and restores energy.',
      ja: '午後の業務に備えてランチタイムに少し散歩しましょう。頭がスッキリして体力が回復します。',
    },
    '정관': {
      ko: '오전 업무 성과를 점검하고 오후 계획을 세우세요. 중간 점검이 효율을 높여줍니다.',
      en: 'Review your morning results and plan the afternoon. A midday check-in boosts efficiency.',
      ja: '午前の業務成果を点検して午後の計画を立てましょう。中間チェックが効率を高めます。',
    },
    '편인': {
      ko: '점심시간에 짧은 기사나 칼럼을 읽어 보세요. 오후 업무에 새로운 관점을 더해줍니다.',
      en: 'Read a short article or column at lunch. It adds a fresh perspective to your afternoon work.',
      ja: 'ランチタイムに短い記事やコラムを読んでみましょう。午後の仕事に新しい視点を加えてくれます。',
    },
    '정인': {
      ko: '점심을 먹으며 감사한 마음을 가져 보세요. 먹을 수 있다는 것 자체가 큰 축복입니다.',
      en: 'Feel gratitude as you eat lunch. Having a meal itself is a great blessing.',
      ja: 'ランチを食べながら感謝の気持ちを持ちましょう。食べられること自体が大きな恵みです。',
    },
  },

  // ──────────────────────────────────────────────
  // 미시 (未時) 13:00–15:00
  // ──────────────────────────────────────────────
  '미시': {
    '비견': {
      ko: '오후의 나른함을 동료와 함께 이겨내세요. 간단한 티타임이 활력을 줄 수 있습니다.',
      en: 'Beat the afternoon slump with a colleague. A quick tea break can re-energize both of you.',
      ja: '午後のだるさを同僚と一緒に乗り越えましょう。簡単なティータイムが活力を与えてくれます。',
    },
    '겁재': {
      ko: '오후에 남의 성과에 자극받더라도 조급해하지 마세요. 나만의 속도가 있습니다.',
      en: 'Don\'t rush because of others\' achievements. You have your own pace — trust it.',
      ja: '午後に他人の成果に刺激されても焦らないで。自分だけのペースがあります。',
    },
    '식신': {
      ko: '식곤증이 오는 시간이니 가벼운 간식으로 에너지를 보충하세요. 너무 무겁지 않게.',
      en: 'Post-lunch drowsiness kicks in — have a light snack for an energy boost. Keep it light.',
      ja: '食後の眠気が来る時間なので、軽いおやつでエネルギーを補充しましょう。重すぎないように。',
    },
    '상관': {
      ko: '오후에 예민해지기 쉽습니다. 동료의 말에 바로 반응하지 말고 한 박자 쉬어가세요.',
      en: 'You may feel edgy in the afternoon. Pause before responding to colleagues — take a beat.',
      ja: '午後は敏感になりやすいです。同僚の言葉にすぐ反応せず、一拍置いてみましょう。',
    },
    '편재': {
      ko: '오후에 투자 관련 정보를 분석해 보세요. 차분한 판단이 가능한 시간대입니다.',
      en: 'Analyze investment information this afternoon. It\'s a window for calm, rational decisions.',
      ja: '午後に投資関連の情報を分析してみましょう。冷静な判断ができる時間帯です。',
    },
    '정재': {
      ko: '이달의 고정 지출을 다시 확인해 보세요. 줄일 수 있는 항목이 있을 수 있습니다.',
      en: 'Re-check this month\'s fixed expenses. You might find line items you can cut.',
      ja: '今月の固定支出をもう一度確認しましょう。削れる項目があるかもしれません。',
    },
    '편관': {
      ko: '오후의 긴장감을 적절히 활용하세요. 마감이 있는 업무를 이 시간에 처리하면 효과적입니다.',
      en: 'Channel afternoon tension productively. Work on deadline-driven tasks now for best results.',
      ja: '午後の緊張感を適切に活用しましょう。締切のある仕事をこの時間に処理すると効果的です。',
    },
    '정관': {
      ko: '오후 보고나 회의 준비를 꼼꼼히 하세요. 준비된 사람이 신뢰를 얻습니다.',
      en: 'Prepare thoroughly for afternoon reports or meetings. Prepared people earn trust.',
      ja: '午後の報告や会議の準備をしっかりしましょう。準備ができている人が信頼を得ます。',
    },
    '편인': {
      ko: '오후에 잠시 창밖을 바라보며 생각을 정리해 보세요. 새로운 아이디어가 떠오를 수 있습니다.',
      en: 'Gaze out the window for a moment and gather your thoughts. A new idea may surface.',
      ja: '午後に少し窓の外を眺めて考えを整理してみましょう。新しいアイデアが浮かぶかもしれません。',
    },
    '정인': {
      ko: '오후에 잠깐 부모님이나 은사님에게 안부 메시지를 보내 보세요. 작은 정성이 큰 감동을 줍니다.',
      en: 'Send a brief message to your parents or a mentor this afternoon. A small gesture goes a long way.',
      ja: '午後にちょっと親や恩師に安否メッセージを送ってみましょう。小さな心遣いが大きな感動を与えます。',
    },
  },

  // ──────────────────────────────────────────────
  // 신시 (申時) 15:00–17:00
  // ──────────────────────────────────────────────
  '신시': {
    '비견': {
      ko: '오후 후반, 동료와 함께 프로젝트를 마무리하면 효율이 높아집니다.',
      en: 'Wrapping up a project with a colleague in the late afternoon boosts efficiency.',
      ja: '午後後半、同僚と一緒にプロジェクトを仕上げると効率が上がります。',
    },
    '겁재': {
      ko: '퇴근 전 충동적인 결정을 주의하세요. 하루의 피로가 판단력을 흐리게 할 수 있습니다.',
      en: 'Watch out for impulsive decisions before leaving work. Fatigue clouds judgment.',
      ja: '退勤前の衝動的な決断に注意しましょう。一日の疲れが判断力を鈍らせることがあります。',
    },
    '식신': {
      ko: '오후 간식 타임! 건강한 음료나 과일로 마지막 업무 시간을 버텨 보세요.',
      en: 'Afternoon snack time! Power through the last work hours with healthy drinks or fruit.',
      ja: '午後のおやつタイム！ヘルシーなドリンクやフルーツで最後の業務時間を乗り切りましょう。',
    },
    '상관': {
      ko: '퇴근 전 감정적인 이메일을 보내지 마세요. 임시 보관함에 넣고 내일 다시 읽어 보세요.',
      en: 'Don\'t send that emotional email before leaving. Save it as a draft and reread tomorrow.',
      ja: '退勤前に感情的なメールを送らないで。下書きに入れて明日もう一度読んでみましょう。',
    },
    '편재': {
      ko: '오후 장 마감 전 시장 동향을 확인하세요. 빠른 대응이 수익으로 이어질 수 있습니다.',
      en: 'Check market trends before closing time. Quick action could lead to gains.',
      ja: '午後の市場終了前にマーケット動向を確認しましょう。素早い対応が利益につながるかもしれません。',
    },
    '정재': {
      ko: '오늘 하루 쓴 돈을 정리해 보세요. 매일 기록하는 습관이 재정 건강의 비결입니다.',
      en: 'Tally up today\'s spending. Daily tracking is the secret to financial health.',
      ja: '今日一日使ったお金を整理しましょう。毎日記録する習慣が財政健全化の秘訣です。',
    },
    '편관': {
      ko: '마감 시간이 다가올수록 집중력을 높이세요. 마지막 스퍼트가 결과를 좌우합니다.',
      en: 'Sharpen your focus as the deadline approaches. The final push determines the outcome.',
      ja: '締切が近づくほど集中力を高めましょう。最後のスパートが結果を左右します。',
    },
    '정관': {
      ko: '퇴근 전 오늘의 업무를 정리하고 내일 할 일을 리스트로 만들어 두세요.',
      en: 'Before leaving, wrap up today\'s tasks and prepare a to-do list for tomorrow.',
      ja: '退勤前に今日の業務を整理して、明日やることをリストにしておきましょう。',
    },
    '편인': {
      ko: '퇴근 후 자기 계발 시간을 계획해 보세요. 오후의 배움이 내일의 경쟁력이 됩니다.',
      en: 'Plan some self-development time after work. Afternoon learning becomes tomorrow\'s edge.',
      ja: '退勤後の自己啓発時間を計画しましょう。午後の学びが明日の競争力になります。',
    },
    '정인': {
      ko: '퇴근길에 좋아하는 음악을 들으며 하루를 마무리해 보세요. 마음이 편안해집니다.',
      en: 'Wind down on your way home with your favorite music. It soothes the mind.',
      ja: '帰り道に好きな音楽を聴きながら一日を締めくくりましょう。心が穏やかになります。',
    },
  },

  // ──────────────────────────────────────────────
  // 유시 (酉時) 17:00–19:00
  // ──────────────────────────────────────────────
  '유시': {
    '비견': {
      ko: '퇴근 후 친구나 동료와 가벼운 모임을 가져 보세요. 좋은 인연이 깊어지는 시간입니다.',
      en: 'Meet up casually with friends or colleagues after work. Good bonds deepen at this hour.',
      ja: '退勤後に友人や同僚と軽い集まりを持ちましょう。良い縁が深まる時間です。',
    },
    '겁재': {
      ko: '저녁 약속에서 과소비를 조심하세요. 즐거운 분위기에 지갑이 열리기 쉽습니다.',
      en: 'Watch your wallet at evening gatherings. Fun vibes can loosen your purse strings.',
      ja: '夕方の約束で使いすぎに注意しましょう。楽しい雰囲気で財布が緩みがちです。',
    },
    '식신': {
      ko: '저녁 식사를 정성껏 준비해 보세요. 직접 만든 음식이 하루의 피로를 풀어줍니다.',
      en: 'Put some love into making dinner. A home-cooked meal melts away the day\'s stress.',
      ja: '夕食を丁寧に準備してみましょう。手作りの料理が一日の疲れを癒してくれます。',
    },
    '상관': {
      ko: '퇴근 후 하루의 감정을 정리하세요. 억눌린 감정이 있다면 운동이나 취미로 풀어보세요.',
      en: 'Process the day\'s emotions after work. If you\'ve been holding things in, exercise or a hobby helps.',
      ja: '退勤後に一日の感情を整理しましょう。抑えていた感情があれば、運動や趣味で発散してみましょう。',
    },
    '편재': {
      ko: '저녁 시간에 부업 아이디어를 구체화해 보세요. 퇴근 후의 자유 시간이 수익원이 될 수 있습니다.',
      en: 'Flesh out a side-hustle idea this evening. Your free time after work could become income.',
      ja: '夕方の時間に副業のアイデアを具体化してみましょう。退勤後の自由時間が収入源になるかもしれません。',
    },
    '정재': {
      ko: '퇴근 후 장을 보게 된다면 쇼핑 리스트를 미리 작성하세요. 계획적 소비가 절약의 시작입니다.',
      en: 'If grocery shopping after work, make a list first. Planned purchases are the start of saving.',
      ja: '退勤後に買い物をするなら、ショッピングリストを事前に作りましょう。計画的な消費が節約の始まりです。',
    },
    '편관': {
      ko: '퇴근 후 체력 관리를 위해 운동을 시작해 보세요. 저녁 운동은 스트레스 해소에 효과적입니다.',
      en: 'Start an evening workout routine. Exercising after work is a powerful stress reliever.',
      ja: '退勤後の体力管理のために運動を始めてみましょう。夕方の運動はストレス解消に効果的です。',
    },
    '정관': {
      ko: '퇴근 후에도 자기 관리를 놓지 마세요. 규칙적인 저녁 루틴이 내일의 성공을 준비합니다.',
      en: 'Don\'t drop self-discipline after work. A consistent evening routine prepares tomorrow\'s success.',
      ja: '退勤後も自己管理を怠らないで。規則正しい夜のルーティンが明日の成功を準備します。',
    },
    '편인': {
      ko: '저녁 시간에 관심 분야의 강의나 영상을 시청해 보세요. 꾸준한 학습이 차이를 만듭니다.',
      en: 'Watch a lecture or video on a topic you love this evening. Consistent learning makes the difference.',
      ja: '夕方の時間に関心のある分野の講義や動画を視聴してみましょう。着実な学びが差を生みます。',
    },
    '정인': {
      ko: '가족과 함께하는 저녁 시간을 소중히 여기세요. 따뜻한 대화가 최고의 힐링입니다.',
      en: 'Cherish dinner time with family. Warm conversation is the best healing.',
      ja: '家族と過ごす夕食の時間を大切にしましょう。温かい会話が最高の癒しです。',
    },
  },

  // ──────────────────────────────────────────────
  // 술시 (戌時) 19:00–21:00
  // ──────────────────────────────────────────────
  '술시': {
    '비견': {
      ko: '저녁 모임에서 새로운 사람을 소개받을 수 있습니다. 명함을 챙겨 가세요.',
      en: 'You might be introduced to someone new at an evening gathering. Bring your business card.',
      ja: '夕方の集まりで新しい人を紹介されるかもしれません。名刺を持って行きましょう。',
    },
    '겁재': {
      ko: '저녁에 술자리가 있다면 적당히 조절하세요. 과음은 내일의 컨디션을 망칩니다.',
      en: 'If you\'re drinking tonight, pace yourself. Overdoing it ruins tomorrow\'s condition.',
      ja: '夜に飲み会があるなら適度に控えましょう。飲み過ぎは明日のコンディションを台無しにします。',
    },
    '식신': {
      ko: '저녁 후식으로 달콤한 디저트를 즐겨 보세요. 하루의 보상이 됩니다.',
      en: 'Treat yourself to a sweet dessert after dinner. You deserve a daily reward.',
      ja: '夕食後のデザートに甘いものを楽しみましょう。一日のご褒美になります。',
    },
    '상관': {
      ko: '밤에 SNS에 올리는 글은 한 번 더 생각해 보세요. 감정적인 포스팅은 후회를 부릅니다.',
      en: 'Think twice about evening social media posts. Emotional posts often lead to regret.',
      ja: '夜にSNSに投稿する文は一度考え直しましょう。感情的な投稿は後悔を招きます。',
    },
    '편재': {
      ko: '저녁에 온라인 쇼핑을 할 때는 장바구니에 담아두고 내일 결제하세요. 충동 구매를 방지할 수 있습니다.',
      en: 'When shopping online tonight, add to cart but buy tomorrow. It prevents impulse purchases.',
      ja: '夜にオンラインショッピングをする時はカートに入れて明日決済しましょう。衝動買いを防げます。',
    },
    '정재': {
      ko: '이번 주 지출을 정리하고 다음 주 예산을 세워 보세요. 주간 점검이 재정 안정의 핵심입니다.',
      en: 'Review this week\'s spending and set next week\'s budget. Weekly check-ins are key to financial stability.',
      ja: '今週の支出を整理して来週の予算を立てましょう。週間チェックが財政安定の鍵です。',
    },
    '편관': {
      ko: '내일을 위해 일찍 잠자리 준비를 시작하세요. 규칙적인 수면이 전투력을 높여줍니다.',
      en: 'Start winding down for bed. Regular sleep boosts your fighting power for tomorrow.',
      ja: '明日のために早めに就寝準備を始めましょう。規則正しい睡眠が戦闘力を高めます。',
    },
    '정관': {
      ko: '하루를 돌아보며 잘한 점 세 가지를 떠올려 보세요. 자기 인정이 지속적인 성장의 원동력입니다.',
      en: 'Look back on three things you did well today. Self-acknowledgment fuels lasting growth.',
      ja: '一日を振り返って良かった点を三つ思い浮かべましょう。自己肯定が持続的な成長の原動力です。',
    },
    '편인': {
      ko: '밤 시간을 활용해 온라인 강의를 수강해 보세요. 하루 30분의 학습이 한 달 후 큰 변화를 만듭니다.',
      en: 'Take an online course this evening. Thirty minutes a day creates big change in a month.',
      ja: '夜の時間を活用してオンライン講座を受けてみましょう。一日30分の学習が一ヶ月後に大きな変化を生みます。',
    },
    '정인': {
      ko: '잠들기 전 가족에게 "오늘 수고했어"라고 말해 보세요. 따뜻한 한마디가 하루를 완성합니다.',
      en: 'Tell your family "great job today" before bed. One warm phrase completes the day.',
      ja: '寝る前に家族に「今日もお疲れ様」と言ってみましょう。温かい一言が一日を完成させます。',
    },
  },

  // ──────────────────────────────────────────────
  // 해시 (亥時) 21:00–23:00
  // ──────────────────────────────────────────────
  '해시': {
    '비견': {
      ko: '밤에 친한 친구와 전화 통화를 해 보세요. 오랜 친구의 목소리가 위로가 됩니다.',
      en: 'Call a close friend tonight. The voice of an old friend brings comfort.',
      ja: '夜に親しい友人と電話してみましょう。古い友人の声が慰めになります。',
    },
    '겁재': {
      ko: '밤늦게 하는 쇼핑이나 게임에 시간을 뺏기지 마세요. 내일의 나를 위해 일찍 쉬세요.',
      en: 'Don\'t let late-night shopping or gaming steal your time. Rest early for tomorrow\'s you.',
      ja: '夜遅くのショッピングやゲームに時間を奪われないで。明日の自分のために早く休みましょう。',
    },
    '식신': {
      ko: '야식의 유혹을 이겨내세요. 대신 따뜻한 차 한 잔이 위장과 마음을 편하게 해줍니다.',
      en: 'Resist the late-night snack temptation. A warm cup of tea soothes both stomach and mind.',
      ja: '夜食の誘惑に打ち勝ちましょう。代わりに温かいお茶一杯が胃と心を落ち着けてくれます。',
    },
    '상관': {
      ko: '하루 동안 쌓인 스트레스를 일기에 적어 내려보내세요. 글로 풀어내면 마음이 가벼워집니다.',
      en: 'Write the day\'s stress away in a journal. Putting it on paper lightens the heart.',
      ja: '一日中溜まったストレスを日記に書いて手放しましょう。文字にすると心が軽くなります。',
    },
    '편재': {
      ko: '내일의 금전적 계획을 세워 보세요. 밤에 세운 계획은 아침에 더 명확하게 보입니다.',
      en: 'Draft tomorrow\'s financial plan tonight. Plans made at night look clearer in the morning.',
      ja: '明日の金銭的な計画を立てましょう。夜に立てた計画は朝にもっと明確に見えます。',
    },
    '정재': {
      ko: '오늘의 수입과 지출을 마무리 정리하세요. 꾸준한 기록이 부의 첫걸음입니다.',
      en: 'Finalize today\'s income and expenses. Consistent tracking is the first step to wealth.',
      ja: '今日の収入と支出の最終整理をしましょう。着実な記録が富への第一歩です。',
    },
    '편관': {
      ko: '내일을 위해 알람을 설정하고 일찍 취침하세요. 충분한 수면이 최고의 무기입니다.',
      en: 'Set your alarm and get to bed early. Plenty of sleep is your greatest weapon.',
      ja: '明日のためにアラームを設定して早めに就寝しましょう。十分な睡眠が最高の武器です。',
    },
    '정관': {
      ko: '오늘 하루의 목표 달성도를 체크해 보세요. 꾸준한 자기 평가가 성장을 만듭니다.',
      en: 'Check how well you met today\'s goals. Consistent self-assessment drives growth.',
      ja: '今日一日の目標達成度をチェックしましょう。着実な自己評価が成長を生みます。',
    },
    '편인': {
      ko: '잠들기 전 좋아하는 책을 읽으며 마음을 안정시키세요. 밤의 독서가 내일의 지혜가 됩니다.',
      en: 'Read a favorite book before sleep to calm your mind. Night reading becomes tomorrow\'s wisdom.',
      ja: '寝る前に好きな本を読んで心を安定させましょう。夜の読書が明日の知恵になります。',
    },
    '정인': {
      ko: '하루를 마무리하며 따뜻한 차와 함께 명상해 보세요. 마음의 평화가 깊은 잠으로 이어집니다.',
      en: 'End the day with warm tea and a moment of meditation. Inner peace leads to deep sleep.',
      ja: '一日を締めくくりに温かいお茶と一緒に瞑想してみましょう。心の平和が深い眠りにつながります。',
    },
  },
};
