import React, { useEffect, useState } from 'react';
import { PoliticalParty } from '../types/game';
import { getPartyLogoFilename, getPartyLogoUrl } from '../utils/partyLogos';

interface PartyLogoProps {
  party: Pick<PoliticalParty, 'id' | 'name' | 'shortName' | 'color' | 'logoFile'>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP: Record<NonNullable<PartyLogoProps['size']>, string> = {
  xs: 'w-4 h-4 rounded-sm',
  sm: 'w-6 h-6 rounded',
  md: 'w-8 h-8 rounded-md',
  lg: 'w-11 h-11 rounded-lg',
};

export const PartyLogo: React.FC<PartyLogoProps> = ({
  party,
  size = 'md',
  className = '',
}) => {
  const logoUrl = getPartyLogoUrl(party);
  const filename = getPartyLogoFilename(party);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'missing'>('loading');

  useEffect(() => {
    setStatus('loading');
  }, [logoUrl]);

  const sizeClasses = SIZE_MAP[size];

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none ${sizeClasses} ${
        status === 'loaded' ? 'bg-white border border-slate-200/80' : ''
      } ${className}`}
      style={status !== 'loaded' ? { backgroundColor: party.color } : undefined}
      title={`${party.name} (${filename})`}
    >
      {status !== 'missing' && (
        <img
          src={logoUrl}
          alt={`โลโก้${party.name}`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('missing')}
          className={`w-full h-full object-contain transition-opacity duration-150 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </span>
  );
};
