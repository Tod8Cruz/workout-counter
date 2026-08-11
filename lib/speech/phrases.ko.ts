const KO_COUNTS = [
  '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
  '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스물',
];

export function koCount(n: number): string {
  return KO_COUNTS[n - 1] ?? String(n);
}

export function koSide(side?: 'left' | 'right'): string {
  return side === 'left' ? '왼쪽 ' : side === 'right' ? '오른쪽 ' : '';
}
