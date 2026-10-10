import { swatch } from '../lib/util.js';

// A picture if there is one, otherwise a coloured tile with the name on it.
export default function ItemFace({ item, size = 'md', className = '' }) {
  if (item.image) {
    return (
      <div className={`face face-${size} ${className}`}>
        <img src={item.image} alt="" loading="lazy" />
        <span className="face-label">{item.label}</span>
      </div>
    );
  }
  return (
    <div className={`face face-${size} face-plain ${className}`} style={{ '--c': swatch(item.label) }}>
      <span>{size === 'xs' ? [...item.label][0]?.toUpperCase() : item.label}</span>
    </div>
  );
}
