import { useState, useEffect, useRef } from 'react';
import { GoldRing } from './GoldRing';
import { FlightChip } from './FlightChip';

export interface InterludeMessage {
  text: string;
  durationMs: number;
}

interface FetchInterludeProps<T> {
  flightChipText: string;
  messages: InterludeMessage[];
  fetchTask: () => Promise<T>;
  onSuccess: (data: T) => void;
  onCancel?: () => void;
}

export const FetchInterlude = <T,>({
  flightChipText,
  messages,
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
      setErrorMessage("Couldn't reach SQ. Tap to retry.");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    executeFetch();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 2. Micro-copy Timed Schedule
  useEffect(() => {
    let currentIdx = 0;
    const timeouts: NodeJS.Timeout[] = [];

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
        // Last message reached: wait for its duration, then mark timer finished
        const lastDur = messages[currentIdx].durationMs;
        const t = setTimeout(() => {
          if (!mountedRef.current) return;
          setTimerFinished(true);
        }, lastDur);
        timeouts.push(t);
      }
    };

    scheduleNext();

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [messages]);

  // 3. Complete when BOTH task finished AND full timer sequence completed
  useEffect(() => {
    if (taskFinished && timerFinished && taskData && !isError) {
      onSuccess(taskData);
    }
  }, [taskFinished, timerFinished, taskData, isError, onSuccess]);

  return (
    <div className="flex flex-col justify-between items-center h-full py-4 text-center select-none animate-fade-in">
      {/* Flight Chip at top */}
      <div className="shrink-0 pt-2">
        <FlightChip label={flightChipText} />
      </div>

      {/* Center Loader & Micro-copy */}
      <div className="my-auto flex flex-col items-center justify-center px-4">
        {/* Gold Ring & Halo */}
        <GoldRing isError={isError} />

        {/* Micro-copy line */}
        <div className="mt-8 min-h-[32px] flex items-center justify-center">
          {isError ? (
            <button
              type="button"
              onClick={executeFetch}
              className="font-serif italic text-danger hover:underline text-base sm:text-lg animate-fade-in cursor-pointer"
            >
              {errorMessage || "Couldn't reach SQ. Tap to retry."}
            </button>
          ) : (
            <p className="font-serif italic text-text-secondary text-base sm:text-lg transition-opacity duration-200 animate-fade-in">
              {messages[currentMessageIndex]?.text}
            </p>
          )}
        </div>
      </div>

      {/* Bottom spacer for balance */}
      <div className="shrink-0 h-6" />
    </div>
  );
};
