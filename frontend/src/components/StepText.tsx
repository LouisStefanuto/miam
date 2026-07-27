import { useMemo } from 'react';
import { splitDurations } from '@/lib/parse-durations';
import TimerChip from './TimerChip';

interface StepTextProps {
  text: string;
  /** Prefix making the timer ids unique across recipes and steps. */
  timerIdPrefix: string;
  /** Shown in the timer dock, e.g. "Étape 3". */
  context?: string;
}

/** Renders a step, with every detected duration turned into a timer chip. */
export default function StepText({ text, timerIdPrefix, context }: StepTextProps) {
  const segments = useMemo(() => splitDurations(text), [text]);

  return (
    <>
      {segments.map((segment, i) =>
        segment.type === 'text' ? (
          <span key={i}>{segment.text}</span>
        ) : (
          <TimerChip
            key={i}
            id={`${timerIdPrefix}:${segment.match.start}`}
            seconds={segment.match.seconds}
            label={segment.match.text.trim()}
            context={context}
          />
        ),
      )}
    </>
  );
}
