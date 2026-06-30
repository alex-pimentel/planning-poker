import * as RdxSelect from '@radix-ui/react-select';

function SelectIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  label,
  className = '',
  compact,
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>}
      <RdxSelect.Root value={value} onValueChange={onChange}>
        <RdxSelect.Trigger
          className={`w-full ${compact ? 'px-2 py-1.5 rounded-lg text-xs' : 'px-4 py-3 rounded-xl'} bg-white/5 border border-white/10 text-white flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all cursor-pointer data-[placeholder]:text-slate-500`}
        >
          <RdxSelect.Value placeholder={placeholder || 'Select...'} />
          <RdxSelect.Icon>
            <SelectIcon />
          </RdxSelect.Icon>
        </RdxSelect.Trigger>

        <RdxSelect.Portal>
          <RdxSelect.Content
            position="popper"
            sideOffset={4}
            className="z-50 min-w-[var(--radix-select-trigger-width)] rounded-xl bg-neutral-800 border border-white/10 shadow-2xl overflow-hidden"
          >
            <RdxSelect.Viewport className="p-1">
              {options.map((opt) => (
                <RdxSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className={`relative flex items-center gap-2 ${compact ? 'px-6 py-1.5 text-xs' : 'px-8 py-2.5 text-sm'} rounded-lg text-slate-200 cursor-pointer data-[highlighted]:bg-white/10 data-[highlighted]:text-white data-[state=checked]:text-white outline-none transition-colors`}
                >
                  <RdxSelect.ItemText>{opt.label}</RdxSelect.ItemText>
                  <RdxSelect.ItemIndicator className="absolute left-2">
                    <CheckIcon />
                  </RdxSelect.ItemIndicator>
                </RdxSelect.Item>
              ))}
            </RdxSelect.Viewport>
          </RdxSelect.Content>
        </RdxSelect.Portal>
      </RdxSelect.Root>
    </div>
  );
}
