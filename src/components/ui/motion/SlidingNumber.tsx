import React from 'react';

function Digit({ value, place }: { value: number; place: number }) {
  const digit = Math.floor(value / place) % 10;
  return (
    <span className="relative inline-block h-[1em] w-[1ch] overflow-hidden leading-none tabular-nums select-none font-mono">
      <span
        className="flex flex-col transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `translateY(-${digit * 10}%)` }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="h-[1em] flex items-center justify-center font-bold">
            {i}
          </span>
        ))}
      </span>
    </span>
  );
}

export type SlidingNumberProps = {
  value: number;
  padStart?: boolean;
  className?: string;
};

export function SlidingNumber({
  value,
  padStart = false,
  className = '',
}: SlidingNumberProps) {
  const absValue = Math.abs(value);
  const [integerPart, decimalPart] = absValue.toString().split('.');
  const integerValue = parseInt(integerPart, 10);
  const paddedInteger =
    padStart && integerValue < 10 ? `0${integerPart}` : integerPart;
  const integerDigits = paddedInteger.split('');
  const integerPlaces = integerDigits.map((_, i) =>
    Math.pow(10, integerDigits.length - i - 1)
  );

  return (
    <span className={`inline-flex items-center leading-none tabular-nums font-mono ${className}`}>
      {value < 0 && <span className="mr-0.5">-</span>}
      {integerPlaces.map((place, index) => (
        <Digit key={`int-${index}`} value={integerValue} place={place} />
      ))}
      {decimalPart && (
        <>
          <span>.</span>
          {decimalPart.split('').map((digit, index) => (
            <Digit
              key={`dec-${index}`}
              value={parseInt(digit, 10)}
              place={1}
            />
          ))}
        </>
      )}
    </span>
  );
}

export default SlidingNumber;
