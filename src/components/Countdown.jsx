import React, { useState, useEffect } from 'react';
import './Countdown.css';

const Countdown = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  const formatUnit = (unit) => {
    return unit < 10 ? `0${unit}` : unit;
  };

  return (
    <div className="countdown-container">
      {Object.keys(timeLeft).length ? (
        <div className="countdown-grid">
          <div className="countdown-box blue">
            <span className="countdown-number">{formatUnit(timeLeft.days)}</span>
            <span className="countdown-label">Days</span>
          </div>
          <div className="countdown-box orange">
            <span className="countdown-number">{formatUnit(timeLeft.hours)}</span>
            <span className="countdown-label">Hours</span>
          </div>
          <div className="countdown-box gold">
            <span className="countdown-number">{formatUnit(timeLeft.minutes)}</span>
            <span className="countdown-label">Minutes</span>
          </div>
          <div className="countdown-box dark">
            <span className="countdown-number">{formatUnit(timeLeft.seconds)}</span>
            <span className="countdown-label">Seconds</span>
          </div>
        </div>
      ) : (
        <div className="graduation-arrived">
          <h2 className="headline-lg text-primary">Happy Graduation!</h2>
        </div>
      )}
    </div>
  );
};

export default Countdown;
