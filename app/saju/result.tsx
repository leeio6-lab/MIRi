import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { ShareCard } from '../../src/components/ui/ShareCard';
import { BackButton } from '../../src/components/ui/BackButton';
import { FourPillarsView } from '../../src/components/saju/FourPillars';
import { ElementRadar } from '../../src/components/saju/ElementRadar';
import { SajuTable } from '../../src/components/saju/SajuTable';
import { LifeGraph } from '../../src/components/saju/LifeGraph';
import { MonthlyChart } from '../../src/components/saju/MonthlyChart';
import { LifePeriodTimeline } from '../../src/components/saju/LifePeriodTimeline';
import { CategoryRadar } from '../../src/components/saju/CategoryRadar';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { useAuthStore } from '../../src/stores/authStore';
import { calculateFourPillars } from '../../src/utils/saju-calc';

const SCREEN_W = Dimensions.get('window').width;
const isSmall = SCREEN_W < 380;

const sc = (score?: number) => {
  const s = score ?? 70;
  return s >= 80 ? theme.colors.success : s >= 60 ? theme.colors.gold.primary : s >= 40 ? theme.colors.warning : theme.colors.error;
};

const scoreLabel = (score?: number) => {
  const s = score ?? 70;
  return s >= 85 ? '최상' : s >= 70 ? '상' : s >= 55 ? '중상' : s >= 40 ? '중' : '하';
};

/* ─── Score Ring (animated SVG circle) ─── */
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeW = 8;
  const r = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  const color = sc(score);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <SvgCircle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.bg.tertiary} strokeWidth={strokeW} fill="none" />
        <SvgCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={strokeW} fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={[styles.ringScore, { color }]}>{score}</Text>
      <Text style={styles.ringUnit}>점</Text>
    </View>
  );
}

/* ─── Mini Score Bar ─── */
function MiniBar({ label, score, icon }: { label: string; score?: number; icon: string }) {
  const s = score ?? 0;
  const color = sc(s);
  return (
    <View style={styles.miniBarWrap}>
      <Text style={styles.miniBarIcon}>{icon}</Text>
      <Text style={styles.miniBarLabel}>{label}</Text>
      <View style={styles.miniBarTrack}>
        <View style={[styles.miniBarFill, { width: `${Math.min(s, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.miniBarScore, { color }]}>{s}</Text>
    </View>
  );
}

/* ─── Section Header with number badge ─── */
function SectionNum({ num, title }: { num: number; title: string }) {
  return (
    <View style={styles.secNumRow}>
      <View style={styles.secNumBadge}><Text style={styles.secNumText}>{num}</Text></View>
      <Text style={styles.label}>{title}</Text>
    </View>
  );
}

export default function SajuResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const r = useFortuneStore().sajuResult;
  const { user } = useAuthStore();
  const pillars = user ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour) : null;

  if (!r) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('result.noResult')}</Text>
        <BackButton />
      </View>
    );
  }

  // Resolve fields — support both new v2 and old v1 field names
  const structure = r.structure ?? r.sajuStructure;
  const yearly = r.yearly2026 ?? r.yearlyFortune;
  const lucky = r.lucky ?? r.luckyElements;
  const final = r.finalWords ?? r.finalMessage;
  const { personality, career, wealth, love, health, daeun, lifePeriods, relationship, family, academic } = r;
  const monthly2026 = r.monthly2026 ?? (r as any)[`monthly${new Date().getFullYear()}`];

  let d = 0;
  const nd = () => { d += 60; return d; };
  let secNum = 0;
  const nextSec = () => ++secNum;

  // Dominant element for summary
  const dominantEl = pillars
    ? Object.entries(pillars.elementBalance).sort(([, a], [, b]) => (b as number) - (a as number))[0]
    : null;
  const elHanjaMap: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };

  // Build category radar scores
  const catRadarScores = {
    career: 70,
    wealth: wealth?.score ?? 0,
    love: love?.score ?? 0,
    health: health?.score ?? 0,
    social: relationship?.score ?? 0,
    academic: academic?.score ?? 0,
  };
  const hasCatRadar = catRadarScores.wealth > 0 || catRadarScores.love > 0 || catRadarScores.health > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <BackButton />

      {/* ══════ HERO: Headline ══════ */}
      {r.headline ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          {(() => {
            const parts = r.headline!.split(/\s*[—–]\s*/);
            if (parts.length >= 2) {
              return (
                <View style={styles.headlineWrap}>
                  <Text style={styles.headlineMain}>{parts[0]}</Text>
                  <Text style={styles.headlineSub}>{parts.slice(1).join(' — ')}</Text>
                </View>
              );
            }
            return <Text style={styles.headline}>{r.headline}</Text>;
          })()}
        </Animated.View>
      ) : null}

      {/* ══════ SUMMARY DASHBOARD — 한눈에 보기 ══════ */}
      <Animated.View entering={FadeInDown.delay(nd()).springify()}>
        <GlassCard gold style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>한눈에 보기</Text>

          {/* Score ring + key info */}
          <View style={styles.summaryTop}>
            <ScoreRing score={r.overallScore} size={isSmall ? 90 : 110} />
            <View style={styles.summaryInfo}>
              {pillars && (
                <View style={styles.summaryChip}>
                  <Text style={styles.chipLabel}>일간</Text>
                  <Text style={styles.chipValue}>{pillars.dayMaster}</Text>
                </View>
              )}
              {dominantEl && (
                <View style={styles.summaryChip}>
                  <Text style={styles.chipLabel}>주 오행</Text>
                  <Text style={[styles.chipValue, { color: theme.colors.elements[dominantEl[0] as keyof typeof theme.colors.elements] }]}>
                    {elHanjaMap[dominantEl[0]]} {t(`elements.${dominantEl[0]}Short`)}
                  </Text>
                </View>
              )}
              {structure?.strength && (
                <View style={styles.summaryChip}>
                  <Text style={styles.chipLabel}>신강/신약</Text>
                  <Text style={styles.chipValue} numberOfLines={1}>{structure.strength.slice(0, 6)}</Text>
                </View>
              )}
              <View style={styles.summaryChip}>
                <Text style={styles.chipLabel}>종합 등급</Text>
                <Text style={[styles.chipValue, { color: sc(r.overallScore) }]}>{scoreLabel(r.overallScore)}</Text>
              </View>
            </View>
          </View>

          {/* Mini score bars */}
          {(wealth?.score || love?.score || health?.score || career) && (
            <View style={styles.miniBarSection}>
              {career?.title && <MiniBar label="직업" score={70} icon="💼" />}
              {wealth?.score != null && <MiniBar label="재물" score={wealth.score} icon="💰" />}
              {love?.score != null && <MiniBar label="연애" score={love.score} icon="💕" />}
              {health?.score != null && <MiniBar label="건강" score={health.score} icon="🏥" />}
              {relationship?.score != null && <MiniBar label="대인" score={relationship.score} icon="🤝" />}
              {academic?.score != null && <MiniBar label="학업" score={academic.score} icon="📚" />}
            </View>
          )}

          {/* Quick summary text */}
          {r.summary && (
            <Text style={styles.summaryText} numberOfLines={3}>
              {Array.isArray(r.summary) ? r.summary[0] : r.summary}
            </Text>
          )}

          {/* ── Fortune preview pills ── */}
          {(yearly || lifePeriods || daeun) && (
            <View style={styles.fortunePreview}>
              {yearly?.overview && (
                <View style={styles.fpItem}>
                  <Text style={styles.fpIcon}>📅</Text>
                  <View style={styles.fpInfo}>
                    <Text style={styles.fpLabel}>{new Date().getFullYear()}년 운세</Text>
                    <Text style={styles.fpValue} numberOfLines={1}>
                      {yearly.bestMonth ? `BEST: ${typeof yearly.bestMonth === 'string' ? yearly.bestMonth.slice(0, 12) : yearly.bestMonth}` : yearly.overview.slice(0, 20)}
                    </Text>
                  </View>
                </View>
              )}
              {monthly2026 && monthly2026.length > 0 && (() => {
                const best = [...monthly2026].sort((a: any, b: any) => b.score - a.score)[0];
                return (
                  <View style={styles.fpItem}>
                    <Text style={styles.fpIcon}>📊</Text>
                    <View style={styles.fpInfo}>
                      <Text style={styles.fpLabel}>월별 최고</Text>
                      <Text style={[styles.fpValue, { color: sc(best.score) }]}>{best.month} {best.score}점</Text>
                    </View>
                  </View>
                );
              })()}
              {lifePeriods && lifePeriods.length > 0 && (() => {
                const peak = [...lifePeriods].sort((a: any, b: any) => b.score - a.score)[0];
                return (
                  <View style={styles.fpItem}>
                    <Text style={styles.fpIcon}>🌟</Text>
                    <View style={styles.fpInfo}>
                      <Text style={styles.fpLabel}>평생 피크</Text>
                      <Text style={[styles.fpValue, { color: sc(peak.score) }]}>{peak.period} {peak.score}점</Text>
                    </View>
                  </View>
                );
              })()}
              {daeun?.lifePeak && !lifePeriods && (
                <View style={styles.fpItem}>
                  <Text style={styles.fpIcon}>🌟</Text>
                  <View style={styles.fpInfo}>
                    <Text style={styles.fpLabel}>인생 피크</Text>
                    <Text style={styles.fpValue} numberOfLines={1}>{daeun.lifePeak.slice(0, 16)}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </GlassCard>
      </Animated.View>

      {/* ══════ 운세 카테고리 레이더 차트 ══════ */}
      {hasCatRadar && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <SectionNum num={nextSec()} title="운세 종합 분석" />
            <CategoryRadar scores={catRadarScores} />
          </GlassCard>
        </Animated.View>
      )}

      {/* ══════ 사주팔자 테이블 ══════ */}
      {pillars && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <SectionNum num={nextSec()} title={t('result.sajuPalza')} />
            <SajuTable pillars={pillars} />
          </GlassCard>
        </Animated.View>
      )}

      {/* ══════ 오행 밸런스 ══════ */}
      {pillars && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <SectionNum num={nextSec()} title={t('result.elementBalance')} />
            <ElementRadar balance={pillars.elementBalance} />
            <View style={styles.elTagWrap}>
              {Object.entries(pillars.elementBalance)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([el, pct]) => {
                  const ko = t(`elements.${el}Short`);
                  const hanja = elHanjaMap[el] || '?';
                  const level = (pct as number) >= 30 ? t('result.excess') : (pct as number) >= 20 ? t('result.balanced') : (pct as number) >= 10 ? t('result.deficient') : t('result.veryLow');
                  const elColor = theme.colors.elements[el as keyof typeof theme.colors.elements];
                  const tagBg = (pct as number) >= 30 ? 'rgba(196,148,61,0.12)' : (pct as number) >= 20 ? 'rgba(45,122,95,0.10)' : 'rgba(0,0,0,0.04)';
                  const tagColor = (pct as number) >= 30 ? theme.colors.warning : (pct as number) >= 20 ? theme.colors.success : theme.colors.text.tertiary;
                  return (
                    <View key={el} style={[styles.elTag, { backgroundColor: tagBg, borderColor: tagColor + '30' }]}>
                      <Text style={[styles.elTagHanja, { color: elColor }]}>{hanja}</Text>
                      <Text style={styles.elTagKo}>{ko}</Text>
                      <Text style={[styles.elTagPct, { color: tagColor }]}>{pct}%</Text>
                      <Text style={[styles.elTagLevel, { color: tagColor }]}>{level}</Text>
                    </View>
                  );
                })}
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* ══════ Day Master ══════ */}
      {structure?.dayMaster ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <SectionNum num={nextSec()} title={t('result.dayMasterTitle')} />
            <Text style={styles.bodyText}>{structure.dayMaster}</Text>
            {structure.strength ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sub}>{t('result.strengthJudge')}</Text>
                <Text style={styles.bodyText}>{structure.strength}</Text>
              </>
            ) : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ Gyeokguk + Yongshin ══════ */}
      {structure?.format ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <SectionNum num={nextSec()} title={t('result.gyeokgukYongshin')} />
            <Text style={styles.bodyText}>{structure.format}</Text>
            {structure.yongShin ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sub}>{t('result.yongshinTitle')}</Text>
                <Text style={styles.bodyText}>{structure.yongShin}</Text>
              </>
            ) : null}
            {structure.specialNote ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sub}>{t('result.specialNote')}</Text>
                <Text style={styles.warnText}>{structure.specialNote}</Text>
              </>
            ) : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ Personality ══════ */}
      {personality?.core ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <SectionNum num={nextSec()} title={t('result.personalityAnalysis')} />
            <Text style={styles.bodyText}>{personality.core}</Text>

            {(personality.strengths?.length ?? 0) > 0 && (
              <View style={styles.listWrap}>
                <View style={styles.listHeadRow}>
                  <View style={[styles.listHeadDot, { backgroundColor: theme.colors.success }]} />
                  <Text style={styles.listHead}>{t('result.strengths')}</Text>
                </View>
                {personality.strengths.map((v, i) => (
                  <View key={i} style={styles.listRow}>
                    <Text style={styles.bulletG}>+</Text>
                    <Text style={styles.listVal}>{v}</Text>
                  </View>
                ))}
              </View>
            )}

            {(personality.weaknesses?.length ?? 0) > 0 && (
              <View style={styles.listWrap}>
                <View style={styles.listHeadRow}>
                  <View style={[styles.listHeadDot, { backgroundColor: theme.colors.warning }]} />
                  <Text style={styles.listHead}>{t('result.cautions')}</Text>
                </View>
                {personality.weaknesses.map((v, i) => (
                  <View key={i} style={styles.listRow}>
                    <Text style={styles.bulletO}>-</Text>
                    <Text style={styles.listVal}>{v}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Past Guess — gold card */}
            {(personality.pastGuess?.length ?? 0) > 0 && (
              <View style={styles.pastCard}>
                <Text style={styles.pastHead}>{t('result.pastGuessTitle')}</Text>
                {personality.pastGuess.map((v, i) => (
                  <Text key={i} style={styles.pastText}>{v}</Text>
                ))}
              </View>
            )}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ 올해의 운세 (Yearly + Monthly combined) ══════ */}
      {(yearly?.overview || (monthly2026 && monthly2026.length > 0)) ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard gold style={styles.card}>
            <SectionNum num={nextSec()} title={`${new Date().getFullYear()}년 운세`} />

            {yearly?.overview && (
              <Text style={styles.bodyText}>{yearly.overview}</Text>
            )}

            {/* Monthly bar chart */}
            {monthly2026 && monthly2026.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sub}>월별 운세 흐름</Text>
                <MonthlyChart data={monthly2026} />
                {(() => {
                  const sorted = [...monthly2026].sort((a: any, b: any) => b.score - a.score);
                  const best = sorted[0];
                  const worst = sorted[sorted.length - 1];
                  return (
                    <View style={styles.monthRow}>
                      <View style={[styles.monthCol, styles.monthGoodBg]}>
                        <Text style={styles.monthLbl}>BEST</Text>
                        <Text style={styles.monthGood}>{best.month} ({best.score}점) — {best.keyword}</Text>
                      </View>
                      <View style={[styles.monthCol, styles.monthBadBg]}>
                        <Text style={styles.monthLbl}>주의</Text>
                        <Text style={styles.monthBad}>{worst.month} ({worst.score}점) — {worst.keyword}</Text>
                      </View>
                    </View>
                  );
                })()}
              </>
            )}

            {/* Quarterly cards */}
            {(yearly?.quarters?.length ?? 0) > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sub}>분기별 상세</Text>
                <View style={styles.qGrid}>
                  {yearly!.quarters.map((q: any, i: number) => {
                    const qColor = sc(q.score);
                    return (
                      <View key={i} style={styles.qItem}>
                        <View style={styles.qHeader}>
                          <Text style={styles.qPeriod}>{q.period}</Text>
                          <Text style={[styles.qScore, { color: qColor }]}>{q.score}</Text>
                        </View>
                        <View style={[styles.qAccent, { backgroundColor: qColor }]} />
                        <Text style={styles.qKw}>{q.keyword}</Text>
                        <Text style={styles.qDetail}>{q.detail}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Best/Worst month from yearly */}
            {(yearly?.bestMonth || yearly?.worstMonth) && !monthly2026 && (
              <View style={styles.monthRow}>
                {yearly!.bestMonth ? (
                  <View style={[styles.monthCol, styles.monthGoodBg]}>
                    <Text style={styles.monthLbl}>BEST</Text>
                    <Text style={styles.monthGood}>{yearly!.bestMonth}</Text>
                  </View>
                ) : null}
                {yearly!.worstMonth ? (
                  <View style={[styles.monthCol, styles.monthBadBg]}>
                    <Text style={styles.monthLbl}>주의</Text>
                    <Text style={styles.monthBad}>{yearly!.worstMonth}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ 평생 운세 (Life Period + Daeun combined) ══════ */}
      {(lifePeriods?.length || daeun?.current) ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard gold style={styles.card}>
            <SectionNum num={nextSec()} title="평생 운세" />

            {/* 초년/중년/말년 */}
            {lifePeriods && lifePeriods.length > 0 && (
              <>
                <Text style={styles.sub}>초년 · 중년 · 말년</Text>
                <LifePeriodTimeline data={lifePeriods} />
              </>
            )}

            {/* 대운 그래프 */}
            {daeun?.lifeGraph && daeun.lifeGraph.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sub}>대운 흐름 그래프</Text>
                <LifeGraph data={daeun.lifeGraph} />
              </>
            )}

            {/* 대운 상세 */}
            {daeun?.current && (
              <>
                <View style={styles.divider} />
                <View style={styles.timeline}>
                  <View style={styles.tlNode}>
                    <View style={[styles.tlDot, styles.tlDotOn]} />
                    <View style={styles.tlBody}>
                      <Text style={styles.tlLbl}>{t('result.currentDaeun')}</Text>
                      <Text style={styles.bodyText}>{daeun.current}</Text>
                    </View>
                  </View>
                  <View style={styles.tlLine} />
                  {daeun.nextBigChange ? (
                    <View style={styles.tlNode}>
                      <View style={styles.tlDot} />
                      <View style={styles.tlBody}>
                        <Text style={styles.tlLbl}>{t('result.nextBigChange')}</Text>
                        <Text style={styles.bodyText}>{daeun.nextBigChange}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
                {daeun.lifePeak ? (
                  <View style={styles.peakCard}>
                    <Text style={styles.peakLbl}>{t('result.lifePeak')}</Text>
                    <Text style={styles.peakText}>{daeun.lifePeak}</Text>
                  </View>
                ) : null}
              </>
            )}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ Career ══════ */}
      {career?.title ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <SectionNum num={nextSec()} title={t('result.careerFortune')} />
            <Text style={styles.title}>{career.title}</Text>
            {career.analysis ? <Text style={styles.bodyText}>{career.analysis}</Text> : null}

            {(career.bestFields?.length ?? 0) > 0 && (
              <View style={styles.chipRow}>
                {career.bestFields.map((f: string, i: number) => (
                  <View key={i} style={styles.fieldChip}>
                    <Text style={styles.fieldChipText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}

            {career.avoidFields ? <><View style={styles.divider} /><Text style={styles.sub}>{t('result.avoidFields')}</Text><Text style={styles.warnText}>{career.avoidFields}</Text></> : null}
            {career.timing ? <><View style={styles.divider} /><Text style={styles.sub}>{t('result.jobChangeTiming')}</Text><Text style={styles.bodyText}>{career.timing}</Text></> : null}
            {career.sideJob ? <><View style={styles.divider} /><Text style={styles.sub}>{t('result.sideJob')}</Text><Text style={styles.bodyText}>{career.sideJob}</Text></> : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ Wealth ══════ */}
      {wealth?.title ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.hdr}>
              <SectionNum num={nextSec()} title={t('result.wealthFortune')} />
              {wealth.score > 0 && (
                <View style={[styles.scoreBadge, { backgroundColor: sc(wealth.score) + '18' }]}>
                  <Text style={[styles.scoreBadgeText, { color: sc(wealth.score) }]}>{wealth.score}점</Text>
                </View>
              )}
            </View>
            <Text style={styles.title}>{wealth.title}</Text>
            {wealth.pattern ? <><Text style={styles.sub}>{t('result.moneyPattern')}</Text><Text style={styles.bodyText}>{wealth.pattern}</Text></> : null}
            {wealth.peakYears ? (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>{t('result.wealthPeak')}</Text>
                <Text style={styles.highlightText}>{wealth.peakYears}</Text>
              </View>
            ) : null}
            {wealth.warning ? (
              <View style={styles.alertBox}><Text style={styles.alertT}>{wealth.warning}</Text></View>
            ) : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ Love ══════ */}
      {love?.title ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.hdr}>
              <SectionNum num={nextSec()} title={t('result.loveFortune')} />
              {love.score > 0 && (
                <View style={[styles.scoreBadge, { backgroundColor: sc(love.score) + '18' }]}>
                  <Text style={[styles.scoreBadgeText, { color: sc(love.score) }]}>{love.score}점</Text>
                </View>
              )}
            </View>
            <Text style={styles.title}>{love.title}</Text>
            {love.idealPartner ? (
              <View style={styles.partnerCard}>
                <Text style={styles.partnerHead}>{t('result.idealPartner')}</Text>
                <Text style={styles.partnerText}>{love.idealPartner}</Text>
              </View>
            ) : null}
            {(love.timing || (love as any).tendency) ? (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>{t('result.marriageTiming')}</Text>
                <Text style={styles.highlightText}>{love.timing || (love as any).tendency}</Text>
              </View>
            ) : null}
            {(love.warning || (love as any).advice) ? <><View style={styles.divider} /><Text style={styles.sub}>{t('result.cautionPoint')}</Text><Text style={styles.warnText}>{love.warning || (love as any).advice}</Text></> : null}
            {love.ifInRelationship ? <><View style={styles.divider} /><Text style={styles.sub}>{t('result.currentRelationAdvice')}</Text><Text style={styles.bodyText}>{love.ifInRelationship}</Text></> : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ Health ══════ */}
      {health?.title ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.hdr}>
              <SectionNum num={nextSec()} title={t('result.healthFortune')} />
              {health.score > 0 && (
                <View style={[styles.scoreBadge, { backgroundColor: sc(health.score) + '18' }]}>
                  <Text style={[styles.scoreBadgeText, { color: sc(health.score) }]}>{health.score}점</Text>
                </View>
              )}
            </View>
            <Text style={styles.title}>{health.title}</Text>
            {(health.weakPoints?.length ?? 0) > 0 && health.weakPoints.map((v, i) => (
              <View key={i} style={styles.listRow}><Text style={styles.bulletO}>!</Text><Text style={styles.listVal}>{v}</Text></View>
            ))}
            {(health.dangerPeriod || (health as any).tendency) ? (
              <View style={styles.alertBox}><Text style={styles.alertT}>{health.dangerPeriod || (health as any).tendency}</Text></View>
            ) : null}
            {health.advice ? <><View style={styles.divider} /><Text style={styles.sub}>{t('result.healthAdvice')}</Text><Text style={styles.bodyText}>{health.advice}</Text></> : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ 대인관계운 ══════ */}
      {relationship?.title ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.hdr}>
              <SectionNum num={nextSec()} title="대인관계운" />
              <View style={[styles.scoreBadge, { backgroundColor: sc(relationship.score) + '18' }]}>
                <Text style={[styles.scoreBadgeText, { color: sc(relationship.score) }]}>{relationship.score}점</Text>
              </View>
            </View>
            <Text style={styles.title}>{relationship.title}</Text>

            {relationship.socialStyle ? (
              <>
                <Text style={styles.sub}>대인관계 스타일</Text>
                <Text style={styles.bodyText}>{relationship.socialStyle}</Text>
              </>
            ) : null}

            {relationship.bestRelation ? (
              <View style={styles.relationCard}>
                <View style={styles.relationHeader}>
                  <Text style={styles.relationIcon}>🤝</Text>
                  <Text style={styles.relationLabel}>잘 맞는 유형</Text>
                </View>
                <Text style={styles.relationText}>{relationship.bestRelation}</Text>
              </View>
            ) : null}

            {relationship.cautionRelation ? (
              <View style={[styles.relationCard, styles.relationCaution]}>
                <View style={styles.relationHeader}>
                  <Text style={styles.relationIcon}>⚠️</Text>
                  <Text style={[styles.relationLabel, { color: theme.colors.warning }]}>조심할 관계</Text>
                </View>
                <Text style={styles.relationText}>{relationship.cautionRelation}</Text>
              </View>
            ) : null}

            {relationship.advice ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sub}>관계 조언</Text>
                <Text style={styles.bodyText}>{relationship.advice}</Text>
              </>
            ) : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ 부모/자식운 ══════ */}
      {family?.parentFortune ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <SectionNum num={nextSec()} title="부모 · 자녀운" />

            <View style={styles.familySection}>
              <View style={styles.familyHeader}>
                <Text style={styles.familyIcon}>👨‍👩‍👧</Text>
                <Text style={styles.familyLabel}>부모운</Text>
              </View>
              <Text style={styles.bodyText}>{family.parentFortune}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.familySection}>
              <View style={styles.familyHeader}>
                <Text style={styles.familyIcon}>👶</Text>
                <Text style={styles.familyLabel}>자녀운</Text>
              </View>
              <Text style={styles.bodyText}>{family.childFortune}</Text>
            </View>

            {family.familyDynamic ? (
              <>
                <View style={styles.divider} />
                <View style={styles.familySection}>
                  <View style={styles.familyHeader}>
                    <Text style={styles.familyIcon}>🏠</Text>
                    <Text style={styles.familyLabel}>가정 역학</Text>
                  </View>
                  <Text style={styles.bodyText}>{family.familyDynamic}</Text>
                </View>
              </>
            ) : null}

            {family.advice ? (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>가정 조언</Text>
                <Text style={styles.highlightText}>{family.advice}</Text>
              </View>
            ) : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ 학업/시험운 ══════ */}
      {academic?.title ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.hdr}>
              <SectionNum num={nextSec()} title="학업 · 시험운" />
              <View style={[styles.scoreBadge, { backgroundColor: sc(academic.score) + '18' }]}>
                <Text style={[styles.scoreBadgeText, { color: sc(academic.score) }]}>{academic.score}점</Text>
              </View>
            </View>
            <Text style={styles.title}>{academic.title}</Text>

            {academic.aptitude ? (
              <>
                <Text style={styles.sub}>학습 적성</Text>
                <Text style={styles.bodyText}>{academic.aptitude}</Text>
              </>
            ) : null}

            {academic.bestStudyMethod ? (
              <View style={styles.studyMethodCard}>
                <Text style={styles.studyMethodLabel}>최적 학습법</Text>
                <Text style={styles.studyMethodText}>{academic.bestStudyMethod}</Text>
              </View>
            ) : null}

            {academic.examTiming ? (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightLabel}>시험운 좋은 시기</Text>
                <Text style={styles.highlightText}>{academic.examTiming}</Text>
              </View>
            ) : null}

            {academic.advice ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sub}>학업 조언</Text>
                <Text style={styles.bodyText}>{academic.advice}</Text>
              </>
            ) : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ Lucky Elements ══════ */}
      {lucky ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={styles.card}>
            <SectionNum num={nextSec()} title={t('result.luckyElementsTitle')} />
            <View style={styles.luckyGrid}>
              {lucky.color ? <LuckyItem icon="🎨" label={t('result.luckyColor')} val={lucky.color} /> : null}
              {lucky.number ? <LuckyItem icon="🔢" label={t('result.luckyNumber')} val={lucky.number} /> : null}
              {lucky.direction ? <LuckyItem icon="🧭" label={t('result.luckyDirection')} val={lucky.direction} /> : null}
              {(lucky as any).bestSeason ? <LuckyItem icon="🌸" label={t('result.luckySeason')} val={(lucky as any).bestSeason} /> : null}
            </View>
            {(lucky.avoid ?? (lucky as any).avoidance) ? (
              <View style={styles.avoidBox}>
                <Text style={styles.avoidLabel}>{t('result.avoidThings')}</Text>
                <Text style={styles.avoidText}>{lucky.avoid ?? (lucky as any).avoidance}</Text>
              </View>
            ) : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ Final Words ══════ */}
      {final ? (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard gold style={styles.finalCard}>
            <View style={styles.finalHeader}>
              <View style={styles.finalQuote}><Text style={styles.finalQuoteText}>"</Text></View>
              <Text style={styles.finalLbl}>{t('result.masterFinalWord')}</Text>
            </View>
            <Text style={styles.finalText}>{final}</Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* ══════ Share + Re-analyze ══════ */}
      <View style={styles.shareWrap}>
        <ShareCard type="saju" score={r.overallScore} summary={r.headline || (Array.isArray(r.summary) ? r.summary[0] : r.summary)} />
      </View>
      <TouchableOpacity style={styles.reBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={styles.reBtnT}>{t('result.reAnalyze')}</Text>
      </TouchableOpacity>

      <Text style={styles.disc}>{r.disclaimer || t('common.disclaimer')}</Text>
    </ScrollView>
  );
}

/* ─── Lucky item row ─── */
function LuckyItem({ icon, label, val }: { icon: string; label: string; val: string }) {
  return (
    <View style={styles.luckyRow}>
      <Text style={styles.luckyIcon}>{icon}</Text>
      <Text style={styles.luckyLbl}>{label}</Text>
      <Text style={styles.luckyVal}>{val}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: isSmall ? 16 : theme.spacing.screenPadding, paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 100 },
  empty: { flex: 1, backgroundColor: theme.colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: theme.colors.text.secondary, fontSize: 16 },

  // Headline
  headline: { fontSize: isSmall ? 18 : 20, fontWeight: '700', color: theme.colors.gold.primary, textAlign: 'center', marginBottom: theme.spacing.lg, lineHeight: 30 },
  headlineWrap: { alignItems: 'center', marginBottom: theme.spacing.lg },
  headlineMain: { fontSize: isSmall ? 19 : 22, fontWeight: '700', color: theme.colors.gold.primary, textAlign: 'center', lineHeight: 30 },
  headlineSub: { fontSize: isSmall ? 12 : 14, color: theme.colors.text.secondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  // Summary dashboard
  summaryCard: { marginTop: theme.spacing.sm },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: theme.spacing.md },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: isSmall ? 12 : theme.spacing.lg },
  summaryInfo: { flex: 1, gap: 6 },
  summaryChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 8, backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.sm },
  chipLabel: { fontSize: 10, color: theme.colors.text.tertiary, fontWeight: '500' },
  chipValue: { fontSize: isSmall ? 11 : 13, fontWeight: '700', color: theme.colors.text.primary },
  miniBarSection: { marginTop: theme.spacing.md, gap: 6 },
  miniBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  miniBarIcon: { fontSize: 13, width: 18, textAlign: 'center' },
  miniBarLabel: { fontSize: 11, color: theme.colors.text.secondary, width: 28 },
  miniBarTrack: { flex: 1, height: 6, backgroundColor: theme.colors.bg.tertiary, borderRadius: 3, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 3 },
  miniBarScore: { fontSize: 12, fontWeight: '700', width: 26, textAlign: 'right' },
  summaryText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20, marginTop: theme.spacing.md },

  // Fortune preview pills in summary
  fortunePreview: { marginTop: theme.spacing.md, gap: 6, borderTopWidth: 1, borderTopColor: theme.colors.glass.border, paddingTop: theme.spacing.md },
  fpItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.sm, paddingVertical: 6, paddingHorizontal: 10 },
  fpIcon: { fontSize: 14 },
  fpInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fpLabel: { fontSize: 11, color: theme.colors.text.tertiary, fontWeight: '500' },
  fpValue: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary },

  // Score ring
  ringScore: { fontSize: isSmall ? 28 : 36, fontWeight: '700' },
  ringUnit: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: -4 },

  // Section number badge
  secNumRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.sm },
  secNumBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.gold.primary, alignItems: 'center', justifyContent: 'center' },
  secNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Score badge (for section headers)
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreBadgeText: { fontSize: 14, fontWeight: '700' },

  // Shared section card
  card: { marginTop: theme.spacing.md },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  title: { fontSize: isSmall ? 14 : 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: theme.spacing.sm, lineHeight: 22 },
  bodyText: { fontSize: isSmall ? 13 : 14, color: theme.colors.text.secondary, lineHeight: 21 },
  sub: { fontSize: 13, fontWeight: '600', color: theme.colors.gold.primary, marginBottom: theme.spacing.xs },
  divider: { height: 1, backgroundColor: theme.colors.glass.border, marginVertical: theme.spacing.md },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  goldText: { fontSize: 14, color: theme.colors.gold.primary, lineHeight: 22, fontWeight: '500' },
  warnText: { fontSize: isSmall ? 13 : 14, color: theme.colors.warning, lineHeight: 21 },

  // Highlight box (for peak years, marriage timing, etc.)
  highlightBox: { marginTop: theme.spacing.md, backgroundColor: 'rgba(181,149,48,0.08)', borderRadius: theme.radius.md, padding: isSmall ? 12 : theme.spacing.md },
  highlightLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.xs },
  highlightText: { fontSize: isSmall ? 13 : 14, color: theme.colors.text.secondary, lineHeight: 21 },

  // Field chips (career best fields)
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: theme.spacing.md },
  fieldChip: { backgroundColor: 'rgba(45,122,95,0.10)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(45,122,95,0.20)' },
  fieldChipText: { fontSize: 12, fontWeight: '500', color: theme.colors.success },

  // Lists
  listWrap: { marginTop: theme.spacing.md },
  listHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.xs },
  listHeadDot: { width: 6, height: 6, borderRadius: 3 },
  listHead: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary },
  listRow: { flexDirection: 'row', gap: 6, marginBottom: theme.spacing.xs },
  bulletG: { fontSize: 14, fontWeight: '700', color: theme.colors.success, width: 16 },
  bulletO: { fontSize: 14, fontWeight: '700', color: theme.colors.warning, width: 16, textAlign: 'center' },
  listVal: { flex: 1, fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  // Past guess card
  pastCard: { marginTop: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.gold.primary, borderRadius: theme.radius.md, padding: isSmall ? 12 : theme.spacing.md, backgroundColor: 'rgba(181,149,48,0.05)' },
  pastHead: { fontSize: 13, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.sm },
  pastText: { fontSize: isSmall ? 13 : 14, color: theme.colors.gold.primary, lineHeight: 21, fontStyle: 'italic', marginBottom: theme.spacing.xs },

  // Element tags
  elTagWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: theme.spacing.md },
  elTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1 },
  elTagHanja: { fontSize: 13, fontWeight: '700' },
  elTagKo: { fontSize: 10, color: theme.colors.text.secondary },
  elTagPct: { fontSize: 11, fontWeight: '700' },
  elTagLevel: { fontSize: 9, fontWeight: '600' },

  // Alert box
  alertBox: { marginTop: theme.spacing.sm, backgroundColor: 'rgba(255,152,0,0.08)', borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  alertT: { fontSize: 13, color: theme.colors.warning, lineHeight: 20 },

  // Partner card
  partnerCard: { marginTop: theme.spacing.md, backgroundColor: 'rgba(181,149,48,0.08)', borderRadius: theme.radius.md, padding: isSmall ? 12 : theme.spacing.md },
  partnerHead: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.xs, letterSpacing: 0.5 },
  partnerText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  // Quarter grid
  qGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  qItem: { width: (SCREEN_W - (isSmall ? 32 : 40) - 48 - 8) / 2 as unknown as number, backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.md, padding: isSmall ? 10 : theme.spacing.sm, overflow: 'hidden' },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  qPeriod: { fontSize: 11, fontWeight: '600', color: theme.colors.text.primary },
  qScore: { fontSize: isSmall ? 18 : 22, fontWeight: '700' },
  qAccent: { height: 2, width: 24, borderRadius: 1, marginBottom: 6 },
  qKw: { fontSize: 11, fontWeight: '600', color: theme.colors.gold.primary, marginBottom: 2 },
  qDetail: { fontSize: 10, color: theme.colors.text.tertiary, lineHeight: 15 },
  monthRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  monthCol: { flex: 1, borderRadius: theme.radius.sm, padding: isSmall ? 8 : theme.spacing.sm },
  monthGoodBg: { backgroundColor: 'rgba(45,122,95,0.06)' },
  monthBadBg: { backgroundColor: 'rgba(196,148,61,0.06)' },
  monthLbl: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: theme.spacing.xs, color: theme.colors.text.tertiary },
  monthGood: { fontSize: 12, color: theme.colors.success, lineHeight: 18 },
  monthBad: { fontSize: 12, color: theme.colors.warning, lineHeight: 18 },

  // Timeline
  timeline: { marginTop: theme.spacing.sm },
  tlNode: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
  tlDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.text.tertiary, marginTop: 4 },
  tlDotOn: { backgroundColor: theme.colors.gold.primary },
  tlLine: { width: 2, height: 20, backgroundColor: theme.colors.glass.border, marginLeft: 5 },
  tlBody: { flex: 1 },
  tlLbl: { fontSize: 12, fontWeight: '600', color: theme.colors.gold.muted, marginBottom: 2 },
  peakCard: { marginTop: theme.spacing.md, backgroundColor: 'rgba(181,149,48,0.08)', borderRadius: theme.radius.md, padding: isSmall ? 12 : theme.spacing.md },
  peakLbl: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.xs },
  peakText: { fontSize: isSmall ? 13 : 14, color: theme.colors.text.secondary, lineHeight: 21 },

  // Relationship styles
  relationCard: { marginTop: theme.spacing.sm, backgroundColor: 'rgba(45,122,95,0.06)', borderRadius: theme.radius.md, padding: isSmall ? 12 : theme.spacing.md },
  relationCaution: { backgroundColor: 'rgba(196,148,61,0.06)' },
  relationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  relationIcon: { fontSize: 14 },
  relationLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.success },
  relationText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  // Family styles
  familySection: { },
  familyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  familyIcon: { fontSize: 16 },
  familyLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },

  // Study method card
  studyMethodCard: { marginTop: theme.spacing.md, backgroundColor: 'rgba(44,95,138,0.08)', borderRadius: theme.radius.md, padding: isSmall ? 12 : theme.spacing.md },
  studyMethodLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.info, marginBottom: theme.spacing.xs },
  studyMethodText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  // Lucky items
  luckyGrid: { gap: 8, marginTop: theme.spacing.sm },
  luckyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.sm, paddingVertical: 8, paddingHorizontal: 10 },
  luckyIcon: { fontSize: 16 },
  luckyLbl: { fontSize: 12, color: theme.colors.text.tertiary, width: isSmall ? 48 : 60, fontWeight: '500' },
  luckyVal: { flex: 1, fontSize: 13, color: theme.colors.text.primary, fontWeight: '600', textAlign: 'right' },

  // Avoid box
  avoidBox: { marginTop: theme.spacing.md, backgroundColor: 'rgba(196,148,61,0.06)', borderRadius: theme.radius.sm, padding: isSmall ? 12 : theme.spacing.md },
  avoidLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.warning, marginBottom: theme.spacing.xs },
  avoidText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  // Final words
  finalCard: { marginTop: theme.spacing.xl },
  finalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md },
  finalQuote: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(181,149,48,0.12)', alignItems: 'center', justifyContent: 'center' },
  finalQuoteText: { fontSize: 18, fontWeight: '700', color: theme.colors.gold.primary, marginTop: -2 },
  finalLbl: { fontSize: 12, fontWeight: '600', color: theme.colors.gold.muted, letterSpacing: 0.5 },
  finalText: { fontSize: isSmall ? 14 : 15, color: theme.colors.text.primary, lineHeight: 24, fontWeight: '500' },

  // Share & actions
  shareWrap: { marginTop: theme.spacing.xl },
  reBtn: { marginTop: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.gold.primary, borderRadius: theme.radius.md, paddingVertical: 14, alignItems: 'center' },
  reBtnT: { fontSize: 14, fontWeight: '600', color: theme.colors.gold.primary },
  disc: { fontSize: 10, color: theme.colors.text.tertiary, textAlign: 'center', lineHeight: 14, marginTop: theme.spacing.lg, marginBottom: theme.spacing.md },
});
