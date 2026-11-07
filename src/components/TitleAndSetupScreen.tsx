import React, { useState } from 'react';
import { BookOpen, FolderOpen, Play, Scale, Sliders, User } from 'lucide-react';
import { CharacterInitOptions } from '../engines/governanceEngine';
import {
  CivilianCareer,
  EducationLevel,
  RegionId,
  SaveSlotMetadata,
  ScenarioId,
} from '../types/game';

interface TitleAndSetupScreenProps {
  saveSlots: SaveSlotMetadata[];
  onStartNewGame: (opts: CharacterInitOptions) => void;
  onLoadSlot: (slotId: string) => void;
  onDeleteSlot: (slotId: string) => void;
  onOpenAchievementsModal: () => void;
}

const SCENARIO_OPTIONS: { id: ScenarioId; title: string; subtitle: string }[] = [
  {
    id: ScenarioId.MODERN_THAILAND,
    title: 'Modern Thailand (กติกามาตรฐาน)',
    subtitle: 'รัฐธรรมนูญ พ.ศ. 2560 แก้ไข 2564 · ส.ส. 400 เขต + 100 บัญชีรายชื่อ · เพดานนายกฯ 8 ปี',
  },
  {
    id: ScenarioId.ELECTION_CAMPAIGN,
    title: 'Election Countdown (ศึกเลือกตั้งกำลังมา)',
    subtitle: 'เหลือเวลา 4 เดือนก่อนเลือกตั้งใหญ่ เหมาะสำหรับรีบสังกัดพรรคครบ 90 วันแล้วลงสนามทันที',
  },
  {
    id: ScenarioId.COALITION_CRISIS,
    title: 'Coalition Crisis (วิกฤตพรรคร่วมร้าว)',
    subtitle: 'เริ่มต้นท่ามกลางแรงเสียดทานพรรคร่วมรัฐบาลสูง เสี่ยงสภาล่มหรือยุบสภาก่อนครบวาระ',
  },
  {
    id: ScenarioId.MINORITY_GOV,
    title: 'Minority Government (รัฐบาลเสียงข้างน้อย)',
    subtitle: 'ฝ่ายบริหารมีเสียงต่ำกว่า 251 เสียง ทุกมติกฎหมายและงบประมาณต้องต่อรองอย่างหนัก',
  },
  {
    id: ScenarioId.NEW_CONSTITUTION,
    title: 'Reform Constitution (รัฐธรรมนูญฉบับปฏิรูป)',
    subtitle: 'ส.ส. เขต 350 + บัญชีรายชื่อ 150 · อายุขั้นต่ำ ส.ส. 23 ปี · สังกัดพรรค 60 วัน · ปลดล็อกเสียง ส.ว.',
  },
  {
    id: ScenarioId.SANDBOX,
    title: 'Sandbox Mode (กำหนดกติกาเอง)',
    subtitle: 'ปรับแต่งสัดส่วนที่นั่ง ส.ส. อายุขั้นต่ำ และระยะเวลาสังกัดพรรคได้อย่างอิสระแยกจากกฎหมายจริง',
  },
];

export const TitleAndSetupScreen: React.FC<TitleAndSetupScreenProps> = ({
  saveSlots,
  onStartNewGame,
  onLoadSlot,
  onDeleteSlot,
  onOpenAchievementsModal,
}) => {
  const [name, setName] = useState('กวิน พิทักษ์ประชา');
  const [ageYears, setAgeYears] = useState(29);
  const [education, setEducation] = useState<EducationLevel>(EducationLevel.BACHELOR);
  const [homeRegion, setHomeRegion] = useState<RegionId>('CENTRAL');
  const [civilianCareer, setCivilianCareer] = useState<CivilianCareer>(CivilianCareer.PRIVATE_ANALYST);
  const [scenario, setScenario] = useState<ScenarioId>(ScenarioId.MODERN_THAILAND);

  // Sandbox overrides
  const [sbConstituency, setSbConstituency] = useState(400);
  const [sbPartyList, setSbPartyList] = useState(100);
  const [sbPartyDays, setSbPartyDays] = useState(90);
  const [sbMpAge, setSbMpAge] = useState(25);

  const [activeSubView, setActiveSubView] = useState<'SETUP' | 'LOAD' | 'GUIDE'>('SETUP');

  const buildCurrentInitOptions = (): CharacterInitOptions => ({
    name,
    ageYears,
    education,
    homeRegion,
    civilianCareer,
    scenario,
    customConstitution:
      scenario === ScenarioId.SANDBOX
        ? {
            isSandbox: true,
            constituencySeats: sbConstituency,
            partyListSeats: sbPartyList,
            totalSeats: sbConstituency + sbPartyList,
            normalPartyMembershipDays: sbPartyDays,
            mpMinAge: sbMpAge,
          }
        : undefined,
  });

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartNewGame(buildCurrentInitOptions());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-safe">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 py-3.5 sm:py-4">
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0">
            KKP Life Simulator
          </span>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveSubView('SETUP')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeSubView === 'SETUP'
                  ? 'text-blue-700 font-semibold underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              สร้างตัวละครใหม่
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('LOAD')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeSubView === 'LOAD'
                  ? 'text-blue-700 font-semibold underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              โหลดสล็อตเซฟ ({saveSlots.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('GUIDE')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeSubView === 'GUIDE'
                  ? 'text-blue-700 font-semibold underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              คู่มือกติกา 3 ชั้น
            </button>
            <button
              type="button"
              onClick={onOpenAchievementsModal}
              className="py-1 transition-colors hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              ทำเนียบเกียรติยศ
            </button>
          </nav>

          <button
            type="button"
            onClick={() => {
              if (activeSubView !== 'SETUP') setActiveSubView('SETUP');
              else onStartNewGame(buildCurrentInitOptions());
            }}
            className="min-h-[42px] sm:min-h-[40px] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2"
          >
            <Play className="w-4 h-4 shrink-0" />
            <span>เริ่มเกมทันที</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Mobile Sub-View Segmented Switcher (< md) */}
        <div
          role="tablist"
          aria-label="เมนูตั้งค่าเริ่มต้นบนมือถือ"
          className="md:hidden grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 mb-6 bg-slate-200/70 rounded-xl text-xs"
        >
          {[
            { id: 'SETUP' as const, label: 'สร้างตัวละคร' },
            { id: 'LOAD' as const, label: `โหลดเซฟ (${saveSlots.length})` },
            { id: 'GUIDE' as const, label: 'คู่มือ 3 ชั้น' },
          ].map((item) => {
            const active = activeSubView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveSubView(item.id)}
                className={`min-h-[42px] px-2 py-2 rounded-lg font-medium transition-colors whitespace-nowrap truncate ${
                  active
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onOpenAchievementsModal}
            className="min-h-[42px] px-2 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap truncate"
          >
            ทำเนียบเกียรติยศ
          </button>
        </div>

        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-medium text-slate-500 mb-2">
            Thai Political System 2.0 · เกมกระดานและการ์ดกลยุทธ์ผลัดตา · จำลองการเมืองไทย 3 ชั้น
          </p>
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 font-display tracking-tight leading-tight"
            style={{ textWrap: 'balance' }}
          >
            จากประชาชนคนธรรมดา สู่กระดานอำนาจรัฐสภาและการบริหารประเทศ
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            เริ่มต้นเส้นทางชีวิตด้วยน้ำพักน้ำแรง สะสมชื่อเสียงและเครือข่าย ตรวจสอบคุณสมบัติตามรัฐธรรมนูญ สมัครเข้าพรรคการเมืองจาก 57 พรรค ชิงที่นั่งในสภา 500 เสียง และบริหารงบประมาณแผ่นดิน 3 ล้านล้านบาท โดยทุกการตัดสินใจจะเปลี่ยนเส้นทางเนื้อเรื่องของประเทศ
          </p>
        </div>

        {activeSubView === 'SETUP' && (
          <form onSubmit={handleStart} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Citizen Character Creation */}
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 pb-4 mb-5 sm:mb-6 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
                    01. ข้อมูลประจำตัวประชาชนเริ่มต้น
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    ผู้เล่นทุกคนเริ่มต้นจากสถานะประชาชนทั่วไป แล้วไต่เต้าตามกรอบกฎหมายและคะแนนนิยม
                  </p>
                </div>
                <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ชื่อ-นามสกุล ตัวละคร
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="ระบุชื่อตัวละคร"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    อายุเริ่มต้น: <span className="font-mono tabular-nums text-blue-700">{ageYears} ปี</span>
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={60}
                    value={ageYears}
                    onChange={(e) => setAgeYears(Number(e.target.value))}
                    className="w-full h-6 accent-blue-700 mt-1 cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-0.5">
                    เกณฑ์มาตรฐาน: สมัคร ส.ส. อายุ 25 ปี · รัฐมนตรี/นายกฯ อายุ 35 ปี
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    วุฒิการศึกษา
                  </label>
                  <select
                    value={education}
                    onChange={(e) => setEducation(e.target.value as EducationLevel)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value={EducationLevel.HIGH_SCHOOL}>มัธยมศึกษาตอนปลาย / ปวช.</option>
                    <option value={EducationLevel.BACHELOR}>ปริญญาตรี</option>
                    <option value={EducationLevel.MASTER}>ปริญญาโท</option>
                    <option value={EducationLevel.DOCTORATE}>ปริญญาเอก</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ภูมิภาคบ้านเกิดและฐานเสียงหลัก
                  </label>
                  <select
                    value={homeRegion}
                    onChange={(e) => setHomeRegion(e.target.value as RegionId)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="NORTH">1. ภาคเหนือ (9 จังหวัด · 37 เขตเลือกตั้ง)</option>
                    <option value="NORTHEAST">2. ภาคตะวันออกเฉียงเหนือ (20 จังหวัด · 133 เขตเลือกตั้ง)</option>
                    <option value="CENTRAL">3. ภาคกลาง รวมกรุงเทพฯ (22 จังหวัด · 123 เขตเลือกตั้ง)</option>
                    <option value="EAST">4. ภาคตะวันออก (7 จังหวัด · 29 เขตเลือกตั้ง)</option>
                    <option value="WEST">5. ภาคตะวันตก (5 จังหวัด · 19 เขตเลือกตั้ง)</option>
                    <option value="SOUTH">6. ภาคใต้ (14 จังหวัด · 59 เขตเลือกตั้ง)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  สายอาชีพภาคประชาชนเริ่มต้น (แยกกระเป๋าเงินส่วนตัวออกจากเงินรัฐเด็ดขาด)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: CivilianCareer.PRIVATE_ANALYST,
                      title: 'นักวิเคราะห์เศรษฐกิจเอกชน',
                      meta: 'เงินต้น 120,000 ฿ · รายได้ 38,000 ฿/เดือน',
                    },
                    {
                      id: CivilianCareer.CIVIL_SERVANT,
                      title: 'นักวิชาการท้องถิ่น / ข้าราชการพลเรือน',
                      meta: 'เงินต้น 100,000 ฿ · ความเข้าใจระบบราชการสูง',
                    },
                    {
                      id: CivilianCareer.LOCAL_ENTREPRENEUR,
                      title: 'ผู้ประกอบการ SMEs ภูมิภาค',
                      meta: 'เงินต้น 185,000 ฿ · เครือข่ายธุรกิจเข้มแข็ง',
                    },
                    {
                      id: CivilianCareer.CIVIC_ACTIVIST,
                      title: 'นักกิจกรรมพัฒนาชุมชนและสังคม',
                      meta: 'เงินต้น 90,000 ฿ · ชื่อเสียงเริ่มต้น 60/100',
                    },
                  ].map((c) => {
                    const selected = civilianCareer === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCivilianCareer(c.id)}
                        className={`text-left p-3.5 min-h-[68px] rounded-lg border transition-colors ${
                          selected
                            ? 'border-blue-700 bg-blue-50/60 text-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="text-sm font-semibold">{c.title}</div>
                        <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">{c.meta}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Right Column: Scenario & Ruleset Selection */}
            <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 pb-4 mb-5 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
                    02. ชุดสถานการณ์และกติการัฐธรรมนูญ
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">เลือกยุคและบริบทเริ่มต้นของกระดานการเมือง</p>
                </div>
                <Scale className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              </div>

              <div className="space-y-2.5">
                {SCENARIO_OPTIONS.map((sc) => {
                  const active = scenario === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setScenario(sc.id)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                        active
                          ? 'border-blue-700 bg-blue-50/60'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{sc.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{sc.subtitle}</div>
                    </button>
                  );
                })}
              </div>

              {scenario === ScenarioId.SANDBOX && (
                <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Sliders className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>ตั้งค่ากติกา Sandbox (สมมติแยกจากกฎหมายจริง)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">
                        ส.ส. เขต: <span className="font-mono tabular-nums font-semibold">{sbConstituency}</span>
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={600}
                        value={sbConstituency}
                        onChange={(e) => setSbConstituency(Number(e.target.value))}
                        className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">
                        บัญชีรายชื่อ: <span className="font-mono tabular-nums font-semibold">{sbPartyList}</span>
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={300}
                        value={sbPartyList}
                        onChange={(e) => setSbPartyList(Number(e.target.value))}
                        className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">
                        วันสังกัดพรรคขั้นต่ำ: <span className="font-mono tabular-nums font-semibold">{sbPartyDays} วัน</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={180}
                        value={sbPartyDays}
                        onChange={(e) => setSbPartyDays(Number(e.target.value))}
                        className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">
                        อายุขั้นต่ำผู้สมัคร ส.ส.: <span className="font-mono tabular-nums font-semibold">{sbMpAge} ปี</span>
                      </label>
                      <input
                        type="number"
                        min={18}
                        max={40}
                        value={sbMpAge}
                        onChange={(e) => setSbMpAge(Number(e.target.value))}
                        className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="mt-6 w-full min-h-[48px] py-3 px-4 bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 shrink-0" />
                <span>เข้าสู่กระดานจำลองชีวิตและการเมืองไทย</span>
              </button>
            </section>
          </form>
        )}

        {activeSubView === 'LOAD' && (
          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 pb-4 mb-5 sm:mb-6 border-b border-slate-200">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">สล็อตบันทึกเกมในเครื่อง</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">ระบบบันทึกอัตโนมัติทุกสิ้นเทิร์น และรองรับการบันทึกแยกหลายสล็อต</p>
              </div>
              <FolderOpen className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            </div>

            {saveSlots.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-600 text-sm mb-4">ยังไม่มีข้อมูลสล็อตบันทึกเกมในเบราว์เซอร์นี้</p>
                <button
                  type="button"
                  onClick={() => setActiveSubView('SETUP')}
                  className="min-h-[44px] px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800"
                >
                  สร้างตัวละครเริ่มเกมใหม่
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {saveSlots.map((slot) => (
                  <div key={slot.slotId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{slot.slotName}</div>
                      <div className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        {slot.playerName} · {slot.roleLabel} · {slot.dateLabel} (เทิร์น {slot.turn})
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => onLoadSlot(slot.slotId)}
                        className="flex-1 sm:flex-none min-h-[42px] sm:min-h-[38px] px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 whitespace-nowrap shrink-0"
                      >
                        โหลดเกม
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSlot(slot.slotId)}
                        className="flex-1 sm:flex-none min-h-[42px] sm:min-h-[38px] px-3.5 py-2 border border-slate-300 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 whitespace-nowrap shrink-0"
                      >
                        ลบสล็อต
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSubView === 'GUIDE' && (
          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-6">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
                  คู่มือการเล่น: การเมืองไทย 3 ชั้นในรูปแบบเกมการ์ดและบอร์ดผลัดตา
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">1 เทิร์น = 1 เดือน (30 วันในเกม) · ได้รับ 3 แต้มดำเนินการ (AP) ต่อเดือน</p>
              </div>
              <BookOpen className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Layer 01 · กฎหมายและรัฐธรรมนูญ</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  ทุกตำแหน่งต้องผ่านการตรวจคุณสมบัติจริง เช่น ผู้สมัคร ส.ส. ต้องอายุครบ 25 ปีและสังกัดพรรคครบ 90 วัน (หรือ 30 วันกรณียุบสภา) ส่วนนายกรัฐมนตรีดำรงตำแหน่งสะสมไม่เกิน 8 ปี และร่าง พ.ร.บ. ต้องผ่านครบ 3 วาระและวุฒิสภา
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Layer 02 · อำนาจและรัฐสภา 500 เสียง</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  แข่งขันกับ 57 พรรคการเมืองในการเลือกตั้งเขต 400 ที่นั่ง และบัญชีรายชื่อ 100 ที่นั่ง เปิดโต๊ะเจรจาตั้งรัฐบาลให้เกิน 251 เสียง แบ่งโควตา 18 กระทรวง และระวังการอภิปรายไม่ไว้วางใจจากฝ่ายค้าน
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Layer 03 · การบริหารงบและเนื้อเรื่อง</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  จัดสรรงบประมาณแผ่นดิน 3,000,000 ล้านบาท ดูแล GDP เงินเฟ้อ และคุณภาพชีวิตประชาชน 6 ภูมิภาค พร้อมเผชิญการ์ดเนื้อเรื่องที่ผลของการตัดสินใจจะตามมาส่งผลในอนาคต และไม่มี Game Over เมื่อพ้นตำแหน่ง
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
