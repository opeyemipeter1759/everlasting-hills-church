export default function PastorPortraitPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#1c1c1c] to-[#101010]">
      <svg viewBox="0 0 200 260" className="w-[42%] opacity-[0.14]" aria-hidden="true">
        <circle cx="100" cy="76" r="38" fill="none" stroke="white" strokeWidth="1.5" />
        <path
          d="M22 258 C22 176 48 150 100 150 C152 150 178 176 178 258"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
