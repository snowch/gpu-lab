// Copyright © 2026 Christopher Snow.
// Tensor data keeps floating-point notation; indices and counts keep integer notation.
const floatingText=text=>/[.e]/i.test(text)?text:text+'.0';
export function tensorValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value);
  return floatingText(String(value));
}
// Precision/attention tables already round displayed values, independently of arithmetic.
export function roundedTensorValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Object.is(value,-0)) return tensorValue(value);
  const text=value!==0&&(Math.abs(value)<0.0001||Math.abs(value)>=1e8)
    ?value.toExponential(5)
    :value.toLocaleString('en-GB',{useGrouping:false,maximumFractionDigits:6});
  return floatingText(text);
}
