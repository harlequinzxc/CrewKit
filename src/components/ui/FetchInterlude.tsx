import { useState, useEffect, useRef } from 'react';
import { GoldRing } from '../GoldRing';
import { FlightChip } from '../FlightChip';
import { Starfield } from '../Starfield';
import { motion, AnimatePresence } from 'framer-motion';

export interface InterludeMessage {
  text: string;
  durationMs: number;
}

export interface FetchInterludeProps<T = any> {
  flightChipText?: string;
  messages: InterludeMessage[];
  minTotalMs?: number;
  fetchTask: () => Promise<T>;
  onSuccess: (data: T) => void;
  onCancel?: () => void;
}

export const FetchInterlude = <T,>({
  flightChipText,
  messages,
  minTotalMs,
  fetchTask,
  onSuccess,
}: FetchInterludeProps<T>) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [taskData, setTaskData] = useState<T | null>(null);
  const [taskFinished, setTaskFinished] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  const mountedRef = useRef(true);

  // 1. Run Data Fetch
  const executeFetch = async () => {
    setIsError(false);
    setErrorMessage(null);
    setTaskFinished(false);
    setTaskData(null);

    try {
      const data = await fetchTask();
      if (!mountedRef.current) return;
      setTaskData(data);
      setTaskFinished(true);
    } catch (err) {
      if (!mountedRef.current) return;
      console.warn('Fetch failed', err);
      setIsError(true);
      setErrorMessage("Couldn't reach Singapore Airlines. Tap to retry.");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    executeFetch();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 2. Timed Micro-copy & Minimum Duration Sequence
  useEffect(() => {
    let currentIdx = 0;
    const timeouts: NodeJS.Timeout[] = [];
    const totalCalculated = messages.reduce((acc, m) => acc + m.durationMs, 0);
    const targetMinMs = minTotalMs || totalCalculated;

    const startTime = Date.now();

    const scheduleNext = () => {
      if (currentIdx < messages.length - 1) {
        const dur = messages[currentIdx].durationMs;
        const t = setTimeout(() => {
          if (!mountedRef.current) return;
          currentIdx += 1;
          setCurrentMessageIndex(currentIdx);
          scheduleNext();
        }, dur);
        timeouts.push(t);
      } else {
        // Last message: hold until targetMinMs elapsed
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(messages[currentIdx].durationMs, targetMinMs - elapsed);
        const t = setTimeout(() => {
          if (!mountedRef.current) return;
          setTimerFinished(true);
        }, remaining);
        timeouts.push(t);
      }
    };

    scheduleNext();

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [messages, minTotalMs]);

  // 3. Complete when BOTH task finished AND full timer sequence completed
  useEffect(() => {
    if (taskFinished && timerFinished && taskData && !isError) {
      onSuccess(taskData);
    }
  }, [taskFinished, timerFinished, taskData, isError, onSuccess]);

  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden flex flex-col justify-between items-center bg-ink-950 text-ivory-100 cabin-atmosphere select-none relative py-6 px-4">
      {/* Atmosphere */}
      <Starfield />

      {/* Flight Chip at top */}
      <div className="shrink-0 pt-2 z-10">
        {flightChipText && <FlightChip label={flightChipText} />}
      </div>

      {/* Center Loader & Micro-copy */}
      <div className="my-auto flex flex-col items-center justify-center px-4 z-10">
        {/* Gold Ring & Halo */}
        <GoldRing isError={isError} />

        {/* Micro-copy line with smooth cross-fade */}
        <div className="mt-8 min-h-[40px] flex items-center justify-center">
          {isError ? (
            <button
              type="button"
              onClick={executeFetch}
              className="font-display italic text-danger hover:underline text-lg sm:text-xl animate-fade-in cursor-pointer"
            >
              {errorMessage || "Couldn't reach SQ. Tap to retry."}
            </button>
          ) : (
            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessageIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="font-display italic text-ivory-100/90 text-lg sm:text-xl tracking-wide text-center"
              >
                {messages[currentMessageIndex]?.text}
              </motion.p>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Bottom spacer for visual balance */}
      <div className="shrink-0 h-8 z-10" />
    </div>
  );
};
