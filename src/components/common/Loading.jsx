import React, { useEffect, useState } from 'react';
import { IMAGES } from '../../images/images';
import { ClockLoader } from 'react-spinners';

const Loading = ({ type = "default" }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {

    if (type !== "document" && type !== "meeting") {
      return;
    }

    const timer = setInterval(() => {
      setFrame(prev => prev === 0 ? 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [type]);

  if (type === "document") {
    return (<div className="flex flex-col items-center gap-4">
      <img src={frame === 0 ? IMAGES.LOBOT_SMILE : IMAGES.LOBOT_THINKING} alt="Loading" className="w-64 md:w-72"/>
      <h3 className="text-lg md:text-xl font-bold text-[#FFFFFF]">AI 챗봇과의 동기화를 위해 <br className="md:hidden" />문서를 분석하고 있습니다...</h3>
      <p className="text-sm md:text-base text-[#FFFFFF]">문서 크기에 따라 최대 10초 정도 소요될 수 있습니다.</p>
    </div>)
  }

  if (type === "meeting") {
    return (<div className="flex flex-col items-center gap-4">
      <img src={frame === 0 ? IMAGES.LOBOT_SMILE : IMAGES.LOBOT_THINKING} alt="Loading" className="w-64 md:w-72"/>
      <h3 className="text-lg md:text-xl font-bold text-[#FFFFFF]">AI 챗봇과의 동기화를 위해 <br className="md:hidden" />회의록을 분석하고 있습니다...</h3>
      <p className="text-sm md:text-base text-[#FFFFFF]">회의록 크기에 따라 최대 10초 정도 소요될 수 있습니다.</p>
    </div>)
  }

  return (<div className="flex flex-col items-center justify-center text-center">
    <ClockLoader size={60} color="#bcd8fc"></ClockLoader> 
    <p className="text-lg text-[#FFFFFF] mt-4">페이지 로딩 중입니다.</p>
  </div>
  )
};

export default Loading;
