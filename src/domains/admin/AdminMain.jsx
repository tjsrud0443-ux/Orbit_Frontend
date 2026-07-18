import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserPlus,
  faUserMinus,
  faCommentDots,
  faBoxOpen,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { getAiQuestions, getDashboard, getDeptEmployeeCount, getDeptLeave, getJoinResign } from './adminApi';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import usePageInfoStore from '../../store/usePageInfoStore';

// 1. ChartJS 필수 구성 요소 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- [Mock Data & Constants] ---

const BRAND_COLORS = {
  main: '#3a36db',
  navy: '#1a1c3d',
  greyBlue: '#8a92a6',
  border: '#edf2f9',
  bg: '#f4f7fc',
  donut: ['#4338CA', '#6366F1', '#818CF8', '#A5B4FC',],
  lineExit: '#fc0000',
};

// const mode = import.meta.env.VITE_APP_MODE || 'production';
// const isDemo = mode === 'demo';

// const DEMO_CHART_DEPARTMENTS = [
//   '행정관리팀',
//   '교무팀'
// ];



// --- [Sub Components] ---
const KpiCard = ({ title, value, icon, iconColor, bgColor }) => (
  <div className="bg-white p-6 rounded-2xl border border-[#edf2f9] shadow-sm flex items-center gap-5">
    <div className={`w-14 h-14 rounded-xl flex items-center opacity-80 justify-center flex-shrink-0 ${bgColor} ${iconColor}`}>
      <FontAwesomeIcon icon={icon} className="text-2xl" />
    </div>
    <div className="flex flex-col">
      <p className="text-[#8a92a6] text-xs font-bold mb-0.5 tracking-tight">{title}</p>
      <h3 className="text-xl font-extrabold text-[#1a1c3d]">{value}</h3>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children, extra }) => (
  <div className="bg-white p-8 rounded-2xl border border-[#edf2f9] shadow-sm flex flex-col h-full">
    <div className="flex items-center justify-between mb-8">
      <div className="flex flex-col min-[376px]:flex-row min-[376px]:items-center gap-1 min-[376px]:gap-2">
        <h3 className="text-lg font-bold text-[#1a1c3d]">{title}</h3>
        {subtitle && (
          <span className="text-xs text-gray-400 min-[376px]:mt-1">
            {subtitle}
          </span>
        )}
      </div>
      {extra}
    </div>
    <div className="flex-1 relative min-h-[250px]">
      {children}
    </div>
  </div>
);

// --- [Main Dashboard Component] ---

const AdminMain = () => {
  const { pages } = usePageInfoStore();
  const currentPageInfo = pages.find(p => p.page_code === 'AdminMain');

  const navigate = useNavigate();
  const barRef = useRef(null);
  const [dashboard, setDashboard] = useState({
    allEmployeeCount: 0,
    joinEmployeeCount: 0,
    resignEmployeeCount: 0,
    aiQuestionsCount: 0,
    supplyRequestCount: 0
  });
  const [aiQuestions, setAiQuestions] = useState([]);

  const [deptEmployeeData, setDeptEmployeeData] = useState({
    labels: [],
    datasets: [
      {
        label: '직원 수',
        data: [],
        backgroundColor: BRAND_COLORS.main,
        barThickness: 36,
      },
    ],
  });

  const [deptsLeave, setDeptsLeave] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: BRAND_COLORS.donut,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  });

  // 차트 데이터: 입/퇴사자 추이 (Line)
  const [joinResign, setJoinResign] = useState({
    labels: [],
    datasets: [
      {
        label: '입사자',
        data: [],
        borderColor: BRAND_COLORS.main,
        backgroundColor: 'transparent',
      },
      {
        label: '퇴사자',
        data: [],
        borderColor: BRAND_COLORS.lineExit,
        backgroundColor: 'transparent',
      },
    ],
  });

  useEffect(() => {
    getDashboard().then(resp => {
      setDashboard(resp.data);
    })
  }, []);

  useEffect(() => {
    getDeptEmployeeCount().then(resp => {
      const deptList = resp.data || [];

      setDeptEmployeeData({
        labels: deptList.map(item => item.deptName),
        datasets: [
          {
            label: '직원 수',
            data: deptList.map(item => item.employeeCount),
            backgroundColor: BRAND_COLORS.main,
            barThickness: 36,
            borderRadius: () => {
              return window.innerWidth >= 1024 ? 8 : 2;
            },
          },
        ],
      });
    });
  }, []);

  useEffect(() => {
    getDeptLeave().then(resp => {
      setDeptsLeave({
        labels: resp.data.map(item => item.deptName),
        datasets: [
          {
            data: resp.data.map(item => item.leave),
            backgroundColor: BRAND_COLORS.donut,
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      });
    });
  }, []);

  useEffect(() => {
    getJoinResign().then(resp => {
      const monthlyData = resp.data.joinCount;

      setJoinResign({
        labels: monthlyData.map(item => item.month),
        datasets: [
          {
            label: '입사자',
            data: monthlyData.map(item => item.joinCount),
            borderColor: BRAND_COLORS.main,
            backgroundColor: 'transparent',
          },
          {
            label: '퇴사자',
            data: monthlyData.map(item => item.resignCount),
            borderColor: BRAND_COLORS.lineExit,
            backgroundColor: 'transparent',
          },
        ],
      });
    });
  }, []);

  useEffect(() => {
    getAiQuestions().then(resp => {
      setAiQuestions(resp.data);
    })
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (barRef.current) {
        const chart = barRef.current;
        const isMobile = window.innerWidth < 768;
        chart.data.datasets[0].barThickness = isMobile ? 12 : 36;
        chart.update();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const KPI_DATA = [
    { id: 1, title: '전체 직원 수', value: `${dashboard.allEmployeeCount}명`, icon: faUsers, iconColor: 'text-[#3530B8]', bgColor: 'bg-[#F0F4FF]' },
    { id: 2, title: '신규 입사자 (이번 달)', value: `${dashboard.joinEmployeeCount}명`, icon: faUserPlus, iconColor: 'text-emerald-500', bgColor: 'bg-[#F0F4FF]' },
    { id: 3, title: '퇴사자 (이번 달)', value: `${dashboard.resignEmployeeCount}명`, icon: faUserMinus, iconColor: 'text-[#FF4D4F]', bgColor: 'bg-[#F0F4FF]' },
    { id: 4, title: 'AI 미답변 질문 (대기)', value: `${dashboard.aiQuestionsCount}건`, icon: faCommentDots, iconColor: 'text-amber-500', bgColor: 'bg-[#F0F4FF]' },
    { id: 5, title: '비품 신청 (승인 대기)', value: `${dashboard.supplyRequestCount}건`, icon: faBoxOpen, iconColor: 'text-[#7c3aed]', bgColor: 'bg-[#F0F4FF]' },
  ];

  const leaveValues = deptsLeave.datasets[0].data;
  const isAllLeaveZero = leaveValues.length > 0 && leaveValues.every(value => Number(value) === 0);

  const doughnutData = isAllLeaveZero
    ? {
      labels: deptsLeave.labels,
      datasets: [
        {
          data: deptsLeave.labels.map(() => 1),
          backgroundColor: deptsLeave.labels.map((_, idx) => BRAND_COLORS.donut[idx % BRAND_COLORS.donut.length]),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    }
    : deptsLeave;

  return (
    <div className="flex-1 bg-white min-h-screen p-8 lg:p-12 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* 1. 타이틀 영역 */}
        <div className="flex flex-col gap-1.5 px-1">
          <h1 className="text-3xl font-extrabold text-[#1a1c3d]">{currentPageInfo?.page_name}</h1>
          <p className="text-[#8a92a6] text-sm font-medium tracking-tight">
            {currentPageInfo?.page_info}
          </p>
        </div>

        {/* 2. 상단 핵심 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {KPI_DATA.map((kpi) => (
            <KpiCard key={kpi.id} {...kpi} />
          ))}
        </div>

        {/* 3. 중간 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="부서별 직원 수 현황">
            <Bar
              ref={barRef}
              data={deptEmployeeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: '#f5f6fa' },
                    border: { display: false },
                    ticks: {
                      stepSize: 1
                    }
                  },
                  x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                      autoSkip: false
                    }
                  }
                }
              }}
            />
          </ChartCard>

          <ChartCard title="부서별 연차 사용 현황" subtitle="올해 기준">
            <div className="flex flex-col sm:flex-row items-center justify-between h-full gap-16 lg:gap-20 pl-4 sm:pl-8 md:pl-12">
              <div className="w-full max-w-[200px] h-[200px]">
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '50%',
                    spacing: 3,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const label = context.label || '';
                            const realValue = deptsLeave.datasets[0].data[context.dataIndex] ?? 0;
                            return `${label}: ${realValue}%`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                {deptsLeave.labels.map((label, idx) => (
                  <div key={label} className="flex items-center gap-3 group">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: deptsLeave.datasets[0].backgroundColor[idx] }}
                    />
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-[#8a92a6] group-hover:text-[#1a1c3d] transition-colors whitespace-nowrap">{label}</span>
                      <span className="text-sm font-extrabold text-[#1a1c3d]">{deptsLeave.datasets[0].data[idx]}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        {/* 4. 하단 상세 현황 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="입/퇴사자 현황" subtitle="최근 6개월 기준">
            <Line
              data={joinResign}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    align: 'end',
                    labels: { boxWidth: 5, boxHeight: 5, pointStyle: 'circle', pointStyleWidth: 6, usePointStyle: true, font: { size: 12, weight: 'bold' } }
                  }
                },
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f5f6fa' }, border: { display: false } },
                  x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                      autoSkip: false
                    }
                  }
                }
              }}
            />
          </ChartCard>

          <ChartCard
            title="AI 미답변 질문" subtitle="최근 기준"
            extra={
              <button
                onClick={() => navigate('/adminQna')}
                className="text-[#3a36db] text-xs font-bold flex items-center gap-1 hover:underline group cursor-pointer"
              >
                더보기 <FontAwesomeIcon icon={faChevronRight} className="text-[10px] group-hover:translate-x-1 transition-transform" />
              </button>
            }
          >
            <div className="divide-y divide-gray-100">
              {aiQuestions.length > 0 ? (
                aiQuestions.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-4 px-2"
                  >
                    <span className="text-[#1a1c3d] text-sm font-bold truncate pr-4">
                      {item.question}
                    </span>

                    <span className="text-[#8a92a6] text-xs font-medium whitespace-nowrap">
                      {formatDistanceToNow(
                        new Date(item.created_at.replace(' ', 'T')),
                        {
                          addSuffix: true,
                          locale: ko
                        }
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full min-h-[220px] flex items-center justify-center">
                  <p className="text-sm font-medium text-slate-400">
                    대기 중인 AI 미답변 질문이 없습니다.
                  </p>
                </div>
              )}
            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  );
};

export default AdminMain;
