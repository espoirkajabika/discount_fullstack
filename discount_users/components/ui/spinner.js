// components/ui/Spinner.js
export default function Spinner({ size = '16px', color = 'currentColor' }) {
  return (
    <div 
      style={{
        width: size,
        height: size,
        border: `2px solid transparent`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%'
      }}
      className="spin"
    />
  )
}