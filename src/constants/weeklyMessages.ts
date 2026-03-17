type Lang3 = { ko: string; en: string; ja: string };

export const WEEKLY_MESSAGES: Record<string, Lang3> = {
  // 정관 best combinations
  '정관_겁재': { ko: '이번 주는 맡은 일에 집중하면 인정받아요. {worst}은 충동적 결정을 피하세요.', en: 'Focus on your duties this week for recognition. Avoid impulsive decisions on {worst}.', ja: '今週は任された仕事に集中すれば認められます。{worst}は衝動的な決断を避けて。' },
  '정관_상관': { ko: '원칙을 지키면 보상이 오는 주. {worst}은 말조심이 필요해요.', en: 'Rewards come from following rules this week. Watch your words on {worst}.', ja: '原則を守れば報酬が来る週。{worst}は言葉に注意。' },
  '정관_편관': { ko: '질서 속에서 기회를 잡는 주. {worst}은 외부 압박에 흔들리지 마세요.', en: 'Seize opportunities within order this week. Don\'t waver under pressure on {worst}.', ja: '秩序の中でチャンスをつかむ週。{worst}は外部の圧力に揺れないで。' },

  // 식신 best combinations
  '식신_편관': { ko: '창의력이 빛나는 한 주. {worst}은 스트레스 관리가 핵심이에요.', en: 'Creativity shines this week. Stress management is key on {worst}.', ja: '創造力が輝く一週間。{worst}はストレス管理がカギ。' },
  '식신_겁재': { ko: '아이디어가 넘치는 주. {worst}은 변동에 흔들리지 말고 기록해두세요.', en: 'Ideas overflow this week. Don\'t let changes on {worst} shake you — write them down.', ja: 'アイデアが溢れる週。{worst}の変動に揺れず、記録しておいて。' },
  '식신_편인': { ko: '표현력이 풍부한 주. {worst}은 머리를 좀 쉬게 해주세요.', en: 'Rich expressiveness this week. Give your mind a rest on {worst}.', ja: '表現力が豊かな週。{worst}は頭を少し休ませて。' },

  // 정재 best combinations
  '정재_겁재': { ko: '안정적인 성과가 보이는 주. {worst}은 예상 밖 지출에 주의하세요.', en: 'Steady results this week. Watch for unexpected expenses on {worst}.', ja: '安定した成果が見える週。{worst}は予想外の出費に注意。' },
  '정재_상관': { ko: '꾸준함이 빛나는 주. {worst}은 말보다 행동으로 보여주세요.', en: 'Consistency pays off this week. On {worst}, show through actions, not words.', ja: 'コツコツが光る週。{worst}は言葉より行動で示して。' },
  '정재_편관': { ko: '재물운이 안정적인 주. {worst}은 권위적인 사람과의 갈등 주의.', en: 'Financial stability this week. Watch for conflicts with authority on {worst}.', ja: '財運が安定した週。{worst}は権威的な人との葛藤に注意。' },

  // 편재 best combinations
  '편재_편관': { ko: '기회가 찾아오는 주. {worst}은 무리하지 말고 체력을 아끼세요.', en: 'Opportunities knock this week. Save your energy on {worst}.', ja: 'チャンスが訪れる週。{worst}は無理せず体力を温存。' },
  '편재_정인': { ko: '새로운 인연이 열리는 주. {worst}은 무리하지 말고 충전하세요.', en: 'New connections open this week. Recharge without pushing yourself on {worst}.', ja: '新しい縁が開く週。{worst}は無理せず充電して。' },
  '편재_비견': { ko: '활발한 에너지의 주. {worst}은 경쟁심을 내려놓으세요.', en: 'An energetic week ahead. Let go of competitiveness on {worst}.', ja: '活発なエネルギーの週。{worst}は競争心を手放して。' },

  // 정인 best combinations
  '정인_겁재': { ko: '배움이 깊어지는 주. {worst}은 변화에 저항하지 마세요.', en: 'Learning deepens this week. Don\'t resist change on {worst}.', ja: '学びが深まる週。{worst}は変化に抵抗しないで。' },
  '정인_상관': { ko: '마음이 안정되는 주. {worst}은 감정적 발언을 자제하세요.', en: 'A calming week ahead. Hold back emotional remarks on {worst}.', ja: '心が安定する週。{worst}は感情的な発言を控えて。' },
  '정인_편관': { ko: '지혜가 빛나는 주. {worst}은 외부 압박을 지식으로 이겨내세요.', en: 'Wisdom shines this week. Overcome external pressure with knowledge on {worst}.', ja: '知恵が光る週。{worst}は外部の圧力を知識で乗り越えて。' },

  // 편인 best combinations
  '편인_겁재': { ko: '직관이 날카로운 주. {worst}은 충동을 억누르세요.', en: 'Sharp intuition this week. Suppress impulses on {worst}.', ja: '直感が鋭い週。{worst}は衝動を抑えて。' },
  '편인_상관': { ko: '분석력이 최고인 주. {worst}은 말보다 관찰에 집중하세요.', en: 'Peak analytical power this week. Focus on observing rather than speaking on {worst}.', ja: '分析力が最高の週。{worst}は話すより観察に集中。' },
  '편인_편관': { ko: '통찰력이 깊어지는 주. {worst}은 스트레스를 혼자 안으세요.', en: 'Insight deepens this week. Don\'t shoulder stress alone on {worst}.', ja: '洞察力が深まる週。{worst}はストレスを一人で抱えないで。' },

  // 비견 best combinations
  '비견_편관': { ko: '독립적으로 성과를 내는 주. {worst}은 외부 간섭에 휘둘리지 마세요.', en: 'Achieve independently this week. Don\'t let outside interference sway you on {worst}.', ja: '独立して成果を出す週。{worst}は外部の干渉に振り回されないで。' },
  '비견_상관': { ko: '자기 주도적인 한 주. {worst}은 날카로운 말을 삼가세요.', en: 'A self-driven week. Hold back sharp words on {worst}.', ja: '自分主導の一週間。{worst}は鋭い言葉を控えて。' },
  '비견_겁재': { ko: '에너지가 넘치는 주. {worst}은 과욕을 부리지 마세요.', en: 'Overflowing energy this week. Don\'t be greedy on {worst}.', ja: 'エネルギーが溢れる週。{worst}は欲張らないで。' },

  // 겁재 best combinations
  '겁재_편관': { ko: '변화를 주도할 수 있는 주. {worst}은 권위와 충돌하지 마세요.', en: 'Lead change this week. Avoid clashing with authority on {worst}.', ja: '変化を主導できる週。{worst}は権威と衝突しないで。' },
  '겁재_정관': { ko: '행동력이 빛나는 주. {worst}은 규칙을 무시하면 손해봐요.', en: 'Your initiative shines this week. Breaking rules on {worst} will backfire.', ja: '行動力が光る週。{worst}はルールを無視すると損。' },

  // 상관 best combinations
  '상관_편관': { ko: '표현력이 폭발하는 주. {worst}은 권위자와의 마찰을 피하세요.', en: 'Expressiveness explodes this week. Avoid friction with authority on {worst}.', ja: '表現力が爆発する週。{worst}は権威者との摩擦を避けて。' },
  '상관_정관': { ko: '창의적 아이디어가 넘치는 주. {worst}은 격식을 갖추세요.', en: 'Creative ideas overflow this week. Be formal on {worst}.', ja: '創造的なアイデアが溢れる週。{worst}は礼儀を整えて。' },
  '상관_겁재': { ko: '자유로운 표현이 통하는 주. {worst}은 변동에 당황하지 마세요.', en: 'Free expression works this week. Don\'t panic at changes on {worst}.', ja: '自由な表現が通じる週。{worst}は変動に慌てないで。' },

  // 편관 best combinations
  '편관_겁재': { ko: '도전이 기회가 되는 주. {worst}은 리스크를 최소화하세요.', en: 'Challenges become opportunities this week. Minimize risks on {worst}.', ja: '挑戦がチャンスになる週。{worst}はリスクを最小化して。' },
  '편관_상관': { ko: '강한 추진력의 주. {worst}은 입을 다물면 평화가 와요.', en: 'Strong momentum this week. Keeping quiet on {worst} brings peace.', ja: '強い推進力の週。{worst}は口を閉じれば平和が来る。' },

  // Default fallback
  '_default': { ko: '이번 주 에너지를 {best}에 집중하세요. {worst}은 쉬어가는 날로 삼으면 좋아요.', en: 'Focus your energy on {best} this week. Use {worst} as a rest day.', ja: '今週のエネルギーを{best}に集中して。{worst}は休息の日にすると良い。' },
};
