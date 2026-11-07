import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  ListOrdered,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import {
  ECT_PROVINCE_BY_CODE,
  ECT_PROVINCE_BY_NAME,
  ECT_REGION_LIST,
  ECT_REGION_ORDER,
  ECT_REGIONS_SPEC,
} from '../data/ectRegions';
import { GameState, RegionId } from '../types/game';
import { PartyLogo } from './PartyLogo';

export const ELECTORAL_TEMPLATE_SVG_PATH =
  '/assets/aistudio/Paste_November_02__2026_-_7_04AM_d03473b4';

const BASE_VIEWBOX = {
  x: 180,
  y: 0,
  w: 690,
  h: 1200,
};

// Map SVG local coords <g id="map" transform="translate(170.7559, -0.1212) scale(1.90054)">
const MAP_TX = 170.75587843034992;
const MAP_TY = -0.12115478515625;
const MAP_SCALE = 1.9005424874331418;

export interface ProvinceElectoralMeta {
  code: string;
  name: string;
  regionId: RegionId;
  districts: number[];
  svgCenterX: number;
  svgCenterY: number;
}

export interface SelectedConstituencyInfo {
  provinceCode: string;
  provinceName: string;
  regionId: RegionId;
  districtNumber: number | null;
  totalDistrictsInProvince: number;
  districts: number[];
}

interface ParsedElectoralTemplate {
  innerMapMarkup: string;
  provinces: ProvinceElectoralMeta[];
  provincesByCode: Record<string, ProvinceElectoralMeta>;
  regionCentroids: Record<RegionId, { cx: number; cy: number; defaultZoom: number }>;
}

let cachedTemplateData: ParsedElectoralTemplate | null = null;
let pendingTemplatePromise: Promise<ParsedElectoralTemplate> | null = null;

export function mapProvinceToECTRegion(code: string, name: string): RegionId {
  const byCode = ECT_PROVINCE_BY_CODE[code];
  if (byCode) return byCode.regionId;
  const byName = ECT_PROVINCE_BY_NAME[name.trim()];
  if (byName) return byName.regionId;
  return 'CENTRAL';
}

function parseElectoralSvgString(rawSvg: string): ParsedElectoralTemplate {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) {
    throw new Error('ไม่พบโครงสร้าง <svg> ในไฟล์แผนที่เขตเลือกตั้ง');
  }

  // Remove original embedded <style> so dynamic regional colors control appearance cleanly
  svgEl.querySelectorAll('style').forEach((s) => s.remove());

  const provinces: ProvinceElectoralMeta[] = [];
  const provincesByCode: Record<string, ProvinceElectoralMeta> = {};

  const provinceEls = svgEl.querySelectorAll('g.province');
  provinceEls.forEach((provEl) => {
    const code = provEl.getAttribute('data-province-code') || '';
    const name = (provEl.getAttribute('data-province-name') || '').trim();
    if (!code || !name) return;

    const ectSpec = ECT_PROVINCE_BY_CODE[code] || ECT_PROVINCE_BY_NAME[name];
    const regionId = mapProvinceToECTRegion(code, name);
    const maxOfficialSeats = ectSpec ? ectSpec.seats400 : 99;

    provEl.setAttribute('data-game-region', regionId);

    // Tag header background path so selected province label can highlight cleanly
    const firstHeaderPath = provEl.querySelector(':scope > g:first-of-type path');
    if (firstHeaderPath) {
      firstHeaderPath.classList.add('province-header-pill');
    }

    // Collect electoral district numbers & align strictly with official ECT 400-seat apportionment
    const districtSet = new Set<number>();
    provEl.querySelectorAll('g.electoral-district').forEach((dEl) => {
      const num = Number(dEl.getAttribute('data-district-number') || '0');
      if (num > maxOfficialSeats) {
        dEl.remove();
        return;
      }
      if (num > 0) {
        districtSet.add(num);
      }
    });
    const districts = Array.from(districtSet).sort((a, b) => a - b);

    // Compute approximate province center in root SVG viewBox (180..870, 0..1200)
    const tspan = provEl.querySelector('text.province-name tspan');
    const localX = Number(tspan?.getAttribute('x') || '150');
    const localY = Number(tspan?.getAttribute('y') || '250');
    const svgCenterX = MAP_TX + (localX + 8) * MAP_SCALE;
    const svgCenterY = MAP_TY + (localY + 12) * MAP_SCALE;

    const meta: ProvinceElectoralMeta = {
      code,
      name,
      regionId,
      districts,
      svgCenterX,
      svgCenterY,
    };
    provinces.push(meta);
    provincesByCode[code] = meta;
  });

  // Sort provinces alphabetically in Thai for search & ECT tables
  provinces.sort((a, b) => a.name.localeCompare(b.name, 'th'));

  // Compute centroids for each of the 6 ECT regions
  const defaultZoomByRegion: Record<RegionId, number> = {
    NORTH: 2.5,
    NORTHEAST: 2.15,
    CENTRAL: 2.15,
    EAST: 3.1,
    WEST: 2.35,
    SOUTH: 2.15,
  };

  const regionCentroids = {} as Record<RegionId, { cx: number; cy: number; defaultZoom: number }>;
  ECT_REGION_ORDER.forEach((rid) => {
    const list = provinces.filter((p) => p.regionId === rid);
    if (list.length === 0) {
      regionCentroids[rid] = {
        cx: BASE_VIEWBOX.x + BASE_VIEWBOX.w / 2,
        cy: BASE_VIEWBOX.y + BASE_VIEWBOX.h / 2,
        defaultZoom: 1,
      };
    } else {
      const minX = Math.min(...list.map((p) => p.svgCenterX));
      const maxX = Math.max(...list.map((p) => p.svgCenterX));
      const minY = Math.min(...list.map((p) => p.svgCenterY));
      const maxY = Math.max(...list.map((p) => p.svgCenterY));
      regionCentroids[rid] = {
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        defaultZoom: defaultZoomByRegion[rid],
      };
    }
  });

  return {
    innerMapMarkup: svgEl.innerHTML,
    provinces,
    provincesByCode,
    regionCentroids,
  };
}

async function loadElectoralTemplate(): Promise<ParsedElectoralTemplate> {
  if (cachedTemplateData) return cachedTemplateData;
  if (!pendingTemplatePromise) {
    pendingTemplatePromise = fetch(ELECTORAL_TEMPLATE_SVG_PATH)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const parsed = parseElectoralSvgString(text);
        cachedTemplateData = parsed;
        return parsed;
      })
      .catch((err) => {
        pendingTemplatePromise = null;
        throw err;
      });
  }
  return pendingTemplatePromise;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return { r: 100, g: 116, b: 139 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function mixRgb(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  weight1: number
): string {
  const w1 = Math.max(0, Math.min(1, weight1));
  const w2 = 1 - w1;
  const r = Math.round(c1.r * w1 + c2.r * w2);
  const g = Math.round(c1.g * w1 + c2.g * w2);
  const b = Math.round(c1.b * w1 + c2.b * w2);
  return `rgb(${r}, ${g}, ${b})`;
}

function getReadableTextColor(rgb: { r: number; g: number; b: number }): string {
  const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  const lum = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return lum < 0.44 ? '#FFFFFF' : '#0F172A';
}

interface CameraState {
  cx: number;
  cy: number;
  zoom: number;
}

const DEFAULT_CAMERA: CameraState = {
  cx: BASE_VIEWBOX.x + BASE_VIEWBOX.w / 2,
  cy: BASE_VIEWBOX.y + BASE_VIEWBOX.h / 2,
  zoom: 1,
};

function clampCamera(cam: CameraState): CameraState {
  const zoom = Math.max(1, Math.min(6, cam.zoom));
  const vw = BASE_VIEWBOX.w / zoom;
  const vh = BASE_VIEWBOX.h / zoom;
  const minCx = BASE_VIEWBOX.x + vw / 2;
  const maxCx = BASE_VIEWBOX.x + BASE_VIEWBOX.w - vw / 2;
  const minCy = BASE_VIEWBOX.y + vh / 2;
  const maxCy = BASE_VIEWBOX.y + BASE_VIEWBOX.h - vh / 2;

  return {
    zoom,
    cx:
      minCx > maxCx
        ? BASE_VIEWBOX.x + BASE_VIEWBOX.w / 2
        : Math.max(minCx, Math.min(maxCx, cam.cx)),
    cy:
      minCy > maxCy
        ? BASE_VIEWBOX.y + BASE_VIEWBOX.h / 2
        : Math.max(minCy, Math.min(maxCy, cam.cy)),
  };
}

interface InteractiveMapCanvasProps {
  scopeClass: string;
  innerMapMarkup: string;
  dynamicCss: string;
  camera: CameraState;
  allowSingleFingerPanAt1x: boolean;
  onUpdateCamera: React.Dispatch<React.SetStateAction<CameraState>>;
  onMapClickElement: (provinceCode: string, districtNumber: number | null) => void;
  className?: string;
}

const InteractiveMapCanvas: React.FC<InteractiveMapCanvasProps> = ({
  scopeClass,
  innerMapMarkup,
  dynamicCss,
  camera,
  allowSingleFingerPanAt1x,
  onUpdateCamera,
  onMapClickElement,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startCx: number;
    startCy: number;
    moved: boolean;
  } | null>(null);

  const clamped = clampCamera(camera);
  const vw = BASE_VIEWBOX.w / clamped.zoom;
  const vh = BASE_VIEWBOX.h / clamped.zoom;
  const vx = clamped.cx - vw / 2;
  const vy = clamped.cy - vh / 2;

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (!allowSingleFingerPanAt1x && clamped.zoom <= 1.01 && !e.ctrlKey && !e.metaKey) {
        return;
      }
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      onUpdateCamera((prev) => clampCamera({ ...prev, zoom: prev.zoom * factor }));
    };

    svgEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => svgEl.removeEventListener('wheel', handleWheel);
  }, [allowSingleFingerPanAt1x, clamped.zoom, onUpdateCamera]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'touch' && !allowSingleFingerPanAt1x && clamped.zoom <= 1.02) {
      return;
    }
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startCx: clamped.cx,
      startCy: clamped.cy,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragStateRef.current;
    const svgEl = svgRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !svgEl) return;

    const dxPx = e.clientX - drag.startX;
    const dyPx = e.clientY - drag.startY;
    if (Math.hypot(dxPx, dyPx) > 5) {
      drag.moved = true;
    }
    if (!drag.moved) return;

    const rect = svgEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const unitsPerPx = Math.max(vw / rect.width, vh / rect.height);
    onUpdateCamera(
      clampCamera({
        zoom: clamped.zoom,
        cx: drag.startCx - dxPx * unitsPerPx,
        cy: drag.startCy - dyPx * unitsPerPx,
      })
    );
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragStateRef.current?.pointerId === e.pointerId) {
      const wasMoved = dragStateRef.current.moved;
      setTimeout(() => {
        if (dragStateRef.current?.pointerId === e.pointerId) {
          dragStateRef.current = null;
        }
      }, 0);
      if (!wasMoved) {
        dragStateRef.current = null;
      }
    }
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragStateRef.current?.moved) {
      dragStateRef.current = null;
      return;
    }
    const target = e.target as Element | null;
    if (!target) return;

    const districtEl = target.closest('g.electoral-district');
    if (districtEl) {
      const code = districtEl.getAttribute('data-province-code') || '';
      const dNum = Number(districtEl.getAttribute('data-district-number') || '0');
      if (code) {
        onMapClickElement(code, dNum > 0 ? dNum : null);
      }
      return;
    }

    const provinceEl = target.closest('g.province');
    if (provinceEl) {
      const code = provinceEl.getAttribute('data-province-code') || '';
      if (code) {
        onMapClickElement(code, 1);
      }
    }
  };

  const svgMarkupContent = useMemo(
    () => ({ __html: `<style>${dynamicCss}</style>${innerMapMarkup}` }),
    [dynamicCss, innerMapMarkup]
  );

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="แผนผังจังหวัดและเขตเลือกตั้งของประเทศไทยตามเกณฑ์ 6 ภูมิภาค กกต."
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onClick={handleClick}
      style={{
        touchAction: allowSingleFingerPanAt1x || clamped.zoom > 1.02 ? 'none' : 'pan-y',
      }}
      className={`${scopeClass} electoral-template select-none ${
        clamped.zoom > 1.02 || allowSingleFingerPanAt1x
          ? 'cursor-grab active:cursor-grabbing'
          : 'cursor-pointer'
      } ${className}`}
      dangerouslySetInnerHTML={svgMarkupContent}
    />
  );
};

interface ThailandElectoralMapProps {
  state: GameState;
  onSelectRegion: (regionId: RegionId) => void;
  selectedConstituency: SelectedConstituencyInfo | null;
  onSelectConstituency: (info: SelectedConstituencyInfo | null) => void;
}

export const ThailandElectoralMap: React.FC<ThailandElectoralMapProps> = ({
  state,
  onSelectRegion,
  selectedConstituency,
  onSelectConstituency,
}) => {
  const [template, setTemplate] = useState<ParsedElectoralTemplate | null>(cachedTemplateData);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraState>(DEFAULT_CAMERA);
  const [viewMode, setViewMode] = useState<'MAP' | 'REPORT'>('MAP');
  const [reportScope, setReportScope] = useState<'SELECTED_REGION' | 'ALL_REGIONS'>('SELECTED_REGION');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [modalRegionScope, setModalRegionScope] = useState<'SELECTED_REGION' | 'ALL_REGIONS'>(
    'SELECTED_REGION'
  );
  const [provinceSearch, setProvinceSearch] = useState('');

  useEffect(() => {
    let active = true;
    if (!template) {
      loadElectoralTemplate()
        .then((parsed) => {
          if (active) setTemplate(parsed);
        })
        .catch(() => {
          if (active) setLoadError('ไม่สามารถโหลดไฟล์แผนผังเขตเลือกตั้ง SVG ได้');
        });
    }
    return () => {
      active = false;
    };
  }, [template]);

  // Initialize default constituency selection to player's home/selected region once template loads
  useEffect(() => {
    if (!template) return;
    const isValidSelection =
      selectedConstituency &&
      ECT_REGION_ORDER.includes(selectedConstituency.regionId) &&
      Boolean(template.provincesByCode[selectedConstituency.provinceCode]);

    if (isValidSelection) return;

    const preferredBangkok =
      state.selectedRegionId === 'CENTRAL' ? template.provincesByCode['10'] : undefined;
    const defaultProv =
      preferredBangkok ||
      template.provinces.find((p) => p.regionId === state.selectedRegionId) ||
      template.provinces[0];

    if (defaultProv) {
      onSelectConstituency({
        provinceCode: defaultProv.code,
        provinceName: defaultProv.name,
        regionId: defaultProv.regionId,
        districtNumber: defaultProv.districts[0] || 1,
        totalDistrictsInProvince: defaultProv.districts.length,
        districts: defaultProv.districts,
      });
    }
  }, [template, selectedConstituency, state.selectedRegionId, onSelectConstituency]);

  const handleMapElementSelect = useCallback(
    (provinceCode: string, districtNumber: number | null) => {
      if (!template) return;
      const meta = template.provincesByCode[provinceCode];
      if (!meta) return;

      if (meta.regionId !== state.selectedRegionId) {
        onSelectRegion(meta.regionId);
      }

      onSelectConstituency({
        provinceCode: meta.code,
        provinceName: meta.name,
        regionId: meta.regionId,
        districtNumber: districtNumber ?? meta.districts[0] ?? 1,
        totalDistrictsInProvince: meta.districts.length,
        districts: meta.districts,
      });
    },
    [template, state.selectedRegionId, onSelectRegion, onSelectConstituency]
  );

  const focusOnRegion = useCallback(
    (regionId: RegionId) => {
      onSelectRegion(regionId);
      if (!template) return;

      const centroid = template.regionCentroids[regionId];
      if (centroid) {
        setCamera(
          clampCamera({
            cx: centroid.cx,
            cy: centroid.cy,
            zoom: centroid.defaultZoom,
          })
        );
      }

      if (!selectedConstituency || selectedConstituency.regionId !== regionId) {
        const firstProv =
          regionId === 'CENTRAL'
            ? template.provincesByCode['10'] || template.provinces.find((p) => p.regionId === regionId)
            : template.provinces.find((p) => p.regionId === regionId);
        if (firstProv) {
          onSelectConstituency({
            provinceCode: firstProv.code,
            provinceName: firstProv.name,
            regionId: firstProv.regionId,
            districtNumber: firstProv.districts[0] || 1,
            totalDistrictsInProvince: firstProv.districts.length,
            districts: firstProv.districts,
          });
        }
      }
    },
    [template, onSelectRegion, selectedConstituency, onSelectConstituency]
  );

  const focusOnProvince = useCallback(
    (meta: ProvinceElectoralMeta, districtNum?: number, switchToMap = false) => {
      onSelectRegion(meta.regionId);
      onSelectConstituency({
        provinceCode: meta.code,
        provinceName: meta.name,
        regionId: meta.regionId,
        districtNumber: districtNum ?? meta.districts[0] ?? 1,
        totalDistrictsInProvince: meta.districts.length,
        districts: meta.districts,
      });
      setCamera(
        clampCamera({
          cx: meta.svgCenterX,
          cy: meta.svgCenterY,
          zoom: meta.code === '10' ? 4.3 : 3.6,
        })
      );
      if (switchToMap) {
        setViewMode('MAP');
      }
    },
    [onSelectRegion, onSelectConstituency]
  );

  const buildScopedCss = useCallback(
    (scopeClass: string) => {
      const rules: string[] = [
        `.${scopeClass} .province { cursor: pointer; transition: opacity 150ms ease; }`,
        `.${scopeClass} .electoral-district { cursor: pointer; }`,
        `.${scopeClass} .province-header-pill { fill: rgba(15, 23, 42, 0.06); stroke: rgba(148, 163, 184, 0.35); stroke-width: 0.25; transition: fill 150ms ease; }`,
        `.${scopeClass} .province-name { fill: #0f172a; font-family: 'Anuphan', 'Sarabun', sans-serif; font-size: 5.8px; font-weight: 700; pointer-events: none; }`,
        `.${scopeClass} .district-shape-base { fill: var(--reg-base, #cbd5e1); stroke: var(--reg-stroke, #ffffff); stroke-width: 0.35; transition: filter 120ms ease, stroke-width 120ms ease; }`,
        `.${scopeClass} .district-shape-overlay { fill: var(--reg-overlay, #e2e8f0); stroke: none; pointer-events: none; }`,
        `.${scopeClass} .district-number { fill: var(--reg-text, #0f172a); font-family: 'IBM Plex Mono', 'Anuphan', sans-serif; font-size: 6.6px; font-weight: 700; pointer-events: none; }`,
        `.${scopeClass} .electoral-district:hover .district-shape-base { filter: brightness(1.08); stroke: #0f172a; stroke-width: 0.75; }`,
      ];

      // Uniform ECT 6-region dominant party coloring (Confirmed Decision 2)
      for (const reg of state.regions) {
        const party = state.parties.find((p) => p.id === reg.dominantPartyId);
        const rgb = hexToRgb(party?.color || '#64748B');
        const isSelectedReg = state.selectedRegionId === reg.id;

        const baseColor = isSelectedReg
          ? mixRgb(rgb, { r: 15, g: 23, b: 42 }, 0.86)
          : mixRgb(rgb, { r: 241, g: 245, b: 249 }, 0.72);
        const overlayColor = isSelectedReg
          ? mixRgb(rgb, { r: 255, g: 255, b: 255 }, 0.92)
          : mixRgb(rgb, { r: 248, g: 250, b: 252 }, 0.8);
        const textColor = isSelectedReg
          ? getReadableTextColor(rgb)
          : getReadableTextColor({
              r: Math.round(rgb.r * 0.76 + 244 * 0.24),
              g: Math.round(rgb.g * 0.76 + 247 * 0.24),
              b: Math.round(rgb.b * 0.76 + 250 * 0.24),
            });

        rules.push(
          `.${scopeClass} g.province[data-game-region="${reg.id}"] {` +
            ` --reg-base: ${baseColor};` +
            ` --reg-overlay: ${overlayColor};` +
            ` --reg-stroke: ${isSelectedReg ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)'};` +
            ` --reg-text: ${textColor};` +
            ` opacity: ${isSelectedReg ? '1' : '0.82'};` +
            ` }`
        );
      }

      if (selectedConstituency) {
        const pCode = selectedConstituency.provinceCode;
        rules.push(
          `.${scopeClass} #province-${pCode} { opacity: 1 !important; }`,
          `.${scopeClass} #province-${pCode} .province-header-pill { fill: #dbeafe !important; stroke: #1d4ed8 !important; stroke-width: 0.65 !important; }`,
          `.${scopeClass} #province-${pCode} .province-name { fill: #1e3a8a !important; }`
        );
        if (selectedConstituency.districtNumber) {
          const dId = `district-${pCode}-${selectedConstituency.districtNumber}`;
          rules.push(
            `.${scopeClass} #${dId} .district-shape-base { stroke: #0f172a !important; stroke-width: 1.25 !important; filter: brightness(1.1); }`
          );
        }
      }

      return rules.join('\n');
    },
    [state.regions, state.parties, state.selectedRegionId, selectedConstituency]
  );

  const inlineCss = useMemo(() => buildScopedCss('inline-electoral-svg'), [buildScopedCss]);
  const modalCss = useMemo(() => buildScopedCss('fullscreen-electoral-svg'), [buildScopedCss]);

  const buildGroupedReportSections = useCallback(
    (scope: 'SELECTED_REGION' | 'ALL_REGIONS', queryText: string) => {
      if (!template) return [];
      const q = queryText.trim().toLowerCase();
      const targetSpecs =
        q || scope === 'ALL_REGIONS'
          ? ECT_REGION_LIST
          : ECT_REGION_LIST.filter((r) => r.id === state.selectedRegionId);

      return targetSpecs
        .map((regSpec) => {
          const gameReg = state.regions.find((r) => r.id === regSpec.id);
          const domParty = state.parties.find((p) => p.id === gameReg?.dominantPartyId);
          const provs = template.provinces.filter((p) => {
            if (p.regionId !== regSpec.id) return false;
            if (!q) return true;
            return (
              p.name.toLowerCase().includes(q) ||
              p.code.includes(q) ||
              regSpec.name.toLowerCase().includes(q)
            );
          });
          return {
            regSpec,
            gameReg,
            domParty,
            provs,
            totalDistrictsShown: provs.reduce((acc, p) => acc + p.districts.length, 0),
          };
        })
        .filter((sec) => sec.provs.length > 0);
    },
    [template, state.selectedRegionId, state.regions, state.parties]
  );

  const inlineReportSections = useMemo(
    () => buildGroupedReportSections(reportScope, provinceSearch),
    [buildGroupedReportSections, reportScope, provinceSearch]
  );

  const modalReportSections = useMemo(
    () => buildGroupedReportSections(modalRegionScope, provinceSearch),
    [buildGroupedReportSections, modalRegionScope, provinceSearch]
  );

  const selectedRegionData =
    state.regions.find((r) => r.id === state.selectedRegionId) || state.regions[0];
  const selectedRegionSpec = ECT_REGIONS_SPEC[selectedRegionData.id] || ECT_REGION_LIST[0];
  const dominantParty = state.parties.find((p) => p.id === selectedRegionData.dominantPartyId);

  return (
    <>
      {/* Focused Map Container (Preserves section > div:nth-of-type(2) > svg:nth-of-type(1) structure) */}
      <div className="my-3 relative flex flex-col items-center justify-between bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 sm:p-3 overflow-hidden">
        {/* Top Toolbar inside Focused Map Container: Segmented View Switcher + Zoom / Fullscreen Controls */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2 border-b border-slate-200/80">
          {/* Segmented Switcher: Interactive Map vs ECT 6-Region Province Table */}
          <div
            role="tablist"
            aria-label="สลับมุมมองแผนที่และตารางรายงานเขตเลือกตั้ง กกต."
            className="inline-flex items-center gap-0.5 p-0.5 bg-slate-200/75 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'MAP'}
              onClick={() => setViewMode('MAP')}
              className={`min-h-[36px] sm:min-h-[32px] px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                viewMode === 'MAP'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 shrink-0" />
              <span>แผนที่เขตเลือกตั้ง</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'REPORT'}
              onClick={() => setViewMode('REPORT')}
              className={`min-h-[36px] sm:min-h-[32px] px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                viewMode === 'REPORT'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 shrink-0" />
              <span>ตารางรายชื่อจังหวัด กกต.</span>
            </button>
          </div>

          {/* Right Controls: Zoom Controls (Map Mode) + Fullscreen Button */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 ml-auto">
            {viewMode === 'MAP' && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCamera((prev) => clampCamera({ ...prev, zoom: prev.zoom * 1.3 }))
                  }
                  aria-label="ซูมเข้า"
                  title="ซูมเข้า"
                  className="min-h-[34px] min-w-[34px] sm:min-h-[30px] sm:min-w-[30px] rounded-md text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 text-[11px] font-mono tabular-nums font-semibold text-slate-700 select-none">
                  {Math.round(camera.zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCamera((prev) => clampCamera({ ...prev, zoom: prev.zoom / 1.3 }))
                  }
                  disabled={camera.zoom <= 1.01}
                  aria-label="ซูมออก"
                  title="ซูมออก"
                  className="min-h-[34px] min-w-[34px] sm:min-h-[30px] sm:min-w-[30px] rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-35 inline-flex items-center justify-center transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => focusOnRegion(state.selectedRegionId)}
                  aria-label="ซูมโฟกัสภูมิภาคที่เลือก"
                  title="โฟกัสภูมิภาคที่เลือก"
                  className="min-h-[34px] min-w-[34px] sm:min-h-[30px] sm:min-w-[30px] rounded-md text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCamera(DEFAULT_CAMERA)}
                  disabled={camera.zoom <= 1.01}
                  aria-label="รีเซ็ตมุมมองเต็มประเทศ"
                  title="รีเซ็ตทั้งประเทศ (100%)"
                  className="min-h-[34px] min-w-[34px] sm:min-h-[30px] sm:min-w-[30px] rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-35 inline-flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-0.5" />
              </>
            )}

            <button
              type="button"
              onClick={() => setIsFullScreen(true)}
              className="min-h-[34px] sm:min-h-[30px] px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5 shrink-0" />
              <span>ขยายเต็มจอ</span>
            </button>
          </div>
        </div>

        {/* Main Viewport: Either Interactive SVG Map OR Official ECT 6-Region Province Table */}
        {loadError ? (
          <div className="h-[420px] flex items-center justify-center text-xs text-red-700 px-4 text-center">
            {loadError}
          </div>
        ) : !template ? (
          <div className="h-[420px] sm:h-[500px] w-full flex items-center justify-center text-xs text-slate-500">
            กำลังโหลดผังจังหวัดและเขตเลือกตั้งทั้ง 77 จังหวัด (400 เขต)...
          </div>
        ) : viewMode === 'MAP' ? (
          <InteractiveMapCanvas
            scopeClass="inline-electoral-svg"
            innerMapMarkup={template.innerMapMarkup}
            dynamicCss={inlineCss}
            camera={camera}
            allowSingleFingerPanAt1x={false}
            onUpdateCamera={setCamera}
            onMapClickElement={handleMapElementSelect}
            className="w-full h-[410px] sm:h-[500px] lg:h-[530px]"
          />
        ) : (
          <div className="w-full h-[410px] sm:h-[500px] lg:h-[530px] flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden">
            {/* ECT Report Filter & Search Bar */}
            <div className="p-2.5 sm:p-3 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <div className="inline-flex items-center gap-1 p-0.5 bg-slate-200/75 rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => setReportScope('SELECTED_REGION')}
                  className={`min-h-[32px] px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                    reportScope === 'SELECTED_REGION'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {selectedRegionSpec.ectOrder}. {selectedRegionSpec.name} ({selectedRegionSpec.provincesCount} จ.)
                </button>
                <button
                  type="button"
                  onClick={() => setReportScope('ALL_REGIONS')}
                  className={`min-h-[32px] px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                    reportScope === 'ALL_REGIONS'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ครบทั้ง 6 ภูมิภาค (77 จ.)
                </button>
              </div>

              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={provinceSearch}
                  onChange={(e) => setProvinceSearch(e.target.value)}
                  placeholder="ค้นหาชื่อจังหวัด..."
                  className="w-full min-h-[34px] pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Grouped ECT Province & District Table */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200">
              {inlineReportSections.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 p-6 text-center">
                  ไม่พบรายชื่อจังหวัดที่ตรงกับคำค้นหา
                </div>
              ) : (
                inlineReportSections.map(({ regSpec, gameReg, domParty, provs }) => (
                  <div key={regSpec.id}>
                    <div className="sticky top-0 z-10 px-3 sm:px-3.5 py-2 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0 border border-white/80"
                          style={{ backgroundColor: domParty?.color || '#64748B' }}
                        />
                        <span>
                          {regSpec.ectOrder}. {regSpec.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono tabular-nums">
                        {regSpec.provincesCount} จังหวัด · {gameReg?.constituencySeats ?? regSpec.constituencySeats400} เขตเลือกตั้ง
                        {domParty ? ` · พรรคนำ: ${domParty.shortName}` : ''}
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {provs.map((prov, idx) => {
                        const isSel = selectedConstituency?.provinceCode === prov.code;
                        const dCount = prov.districts.length;
                        return (
                          <button
                            key={prov.code}
                            type="button"
                            onClick={() => focusOnProvince(prov, 1, true)}
                            className={`w-full min-h-[40px] px-3 sm:px-3.5 py-2 text-left text-xs flex items-center justify-between gap-3 transition-colors ${
                              isSel
                                ? 'bg-blue-50/85 text-blue-950 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="truncate">จังหวัด{prov.name}</span>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 font-mono tabular-nums text-[11px]">
                              <span className="text-slate-400 hidden sm:inline">
                                {dCount > 1 ? `เขต 1–${dCount}` : 'เขต 1'}
                              </span>
                              <span className="font-semibold text-slate-900 min-w-[48px] text-right">
                                {dCount} เขต
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ECT Audit Summary Footer */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 shrink-0">
              <span className="font-mono tabular-nums">
                มาตรฐาน กกต. 6 ภูมิภาค · 77 จังหวัด · {state.constitution.constituencySeats} เขตเลือกตั้ง
              </span>
              <span className="text-blue-700 font-medium">
                แตะชื่อจังหวัดเพื่อซูมดูบล็อกเขตบนแผนที่
              </span>
            </div>
          </div>
        )}

        {/* Bottom 6 ECT Region Quick-Focus Buttons (with District Counts) */}
        <div className="w-full pt-2.5 mt-2 border-t border-slate-200/80 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1.5">
            {ECT_REGION_LIST.map((spec) => {
              const reg = state.regions.find((r) => r.id === spec.id);
              const dom = state.parties.find((p) => p.id === reg?.dominantPartyId);
              const isSelected = state.selectedRegionId === spec.id;
              const seatCount = reg?.constituencySeats ?? spec.constituencySeats400;

              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => focusOnRegion(spec.id)}
                  title={`${spec.ectOrder}. ${spec.name} (${spec.provincesCount} จังหวัด · ${seatCount} เขตเลือกตั้ง)`}
                  className={`min-h-[40px] px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-between gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0 border border-white/60"
                      style={{ backgroundColor: dom?.color || '#94A3B8' }}
                    />
                    <span className="truncate">{spec.shortLabel}</span>
                  </span>
                  <span
                    className={`font-mono tabular-nums text-[10px] shrink-0 ${
                      isSelected ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {seatCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 px-0.5">
            <span>
              {viewMode === 'MAP'
                ? `เกณฑ์ กกต. 6 ภูมิภาค (77 จังหวัด · ${state.constitution.constituencySeats} เขต) · แตะบล็อกตัวเลขเพื่อดูรายเขต`
                : `กำลังแสดงตารางรายชื่อจังหวัดตามประกาศ กกต. · กดปุ่มภาคด้านบนเพื่อกรองรายภาค`}
            </span>
            {viewMode === 'MAP' && camera.zoom > 1.02 && (
              <button
                type="button"
                onClick={() => setCamera(DEFAULT_CAMERA)}
                className="text-blue-700 font-semibold hover:underline whitespace-nowrap"
              >
                ดูภาพรวมทั้งประเทศ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full-Screen Electoral Map & ECT 6-Region Inspector Modal */}
      {isFullScreen && template && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="แผนที่ยุทธศาสตร์จังหวัดและรายงานเขตเลือกตั้ง กกต. แบบขยายเต็มจอ"
            className="bg-white sm:border border-slate-200 sm:rounded-2xl w-full max-w-[1400px] h-[100dvh] sm:h-[92vh] flex flex-col overflow-hidden shadow-2xl pb-safe"
          >
            {/* Full-Screen Top Header */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-white">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                  แผนผังยุทธศาสตร์และรายงานเขตเลือกตั้ง กกต. (77 จังหวัด · {state.constitution.constituencySeats} เขต)
                </h2>
                <p className="text-xs text-slate-500">
                  แบ่งภูมิภาคมาตรฐาน กกต. 6 ภาค · ระบายสีพรรคนำระดับภูมิภาค · ซูมและคลิกสำรวจรายจังหวัด-รายเขต
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCamera((prev) => clampCamera({ ...prev, zoom: prev.zoom * 1.35 }))
                    }
                    aria-label="ซูมเข้า"
                    className="min-h-[38px] min-w-[38px] rounded-md bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-mono tabular-nums font-semibold text-slate-800">
                    {Math.round(camera.zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCamera((prev) => clampCamera({ ...prev, zoom: prev.zoom / 1.35 }))
                    }
                    disabled={camera.zoom <= 1.01}
                    aria-label="ซูมออก"
                    className="min-h-[38px] min-w-[38px] rounded-md bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 inline-flex items-center justify-center shadow-2xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCamera(DEFAULT_CAMERA)}
                    className="min-h-[38px] px-2.5 rounded-md text-xs font-medium text-slate-700 hover:bg-white transition-colors whitespace-nowrap"
                  >
                    100%
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullScreen(false)}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ย่อกลับกระดาน</span>
                  <X className="w-4 h-4 sm:hidden" />
                </button>
              </div>
            </div>

            {/* Full-Screen Body Split: Interactive Vector Canvas + ECT 6-Region Province/District Inspector */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12">
              {/* Left 8 Cols: Interactive Pan/Zoom Canvas */}
              <div className="lg:col-span-8 bg-slate-50 relative flex flex-col min-h-[48dvh] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200">
                <div className="p-2.5 sm:p-3 border-b border-slate-200/70 bg-white/85 backdrop-blur-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => setCamera(DEFAULT_CAMERA)}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
                      camera.zoom <= 1.02
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    ทั่วประเทศ (400)
                  </button>
                  {ECT_REGION_LIST.map((spec) => {
                    const reg = state.regions.find((r) => r.id === spec.id);
                    const dom = state.parties.find((p) => p.id === reg?.dominantPartyId);
                    const active = state.selectedRegionId === spec.id && camera.zoom > 1.02;
                    const seatCount = reg?.constituencySeats ?? spec.constituencySeats400;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => focusOnRegion(spec.id)}
                        className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                          active
                            ? 'bg-blue-700 text-white font-semibold'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0 border border-white/60"
                          style={{ backgroundColor: dom?.color || '#94A3B8' }}
                        />
                        <span>{spec.ectOrder}. {spec.name}</span>
                        <span className="font-mono tabular-nums opacity-80">({seatCount})</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                  <InteractiveMapCanvas
                    scopeClass="fullscreen-electoral-svg"
                    innerMapMarkup={template.innerMapMarkup}
                    dynamicCss={modalCss}
                    camera={camera}
                    allowSingleFingerPanAt1x={true}
                    onUpdateCamera={setCamera}
                    onMapClickElement={handleMapElementSelect}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Right 4 Cols: Selected Constituency Readout + ECT 77-Province Directory */}
              <div className="lg:col-span-4 bg-white flex flex-col min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
                {selectedConstituency && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="text-xs text-slate-500">
                      ลำดับ กกต. ที่ {selectedRegionSpec.ectOrder} · {selectedRegionData.name} ({selectedRegionSpec.provincesCount} จังหวัด)
                      {selectedRegionData.id === state.player.homeRegion && ' · พื้นที่บ้านเกิดคุณ'}
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 font-display">
                        จังหวัด{selectedConstituency.provinceName}
                        {selectedConstituency.districtNumber
                          ? ` · เขตเลือกตั้งที่ ${selectedConstituency.districtNumber}`
                          : ''}
                      </h3>
                      <span className="text-xs font-mono tabular-nums text-blue-700 font-semibold shrink-0">
                        รวม {selectedConstituency.totalDistrictsInProvince} เขต
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-500 mb-1.5">
                        เลือกหมายเลขเขตในจังหวัด{selectedConstituency.provinceName}:
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5">
                        {selectedConstituency.districts.map((dNum) => {
                          const isCurrent = selectedConstituency.districtNumber === dNum;
                          return (
                            <button
                              key={dNum}
                              type="button"
                              onClick={() =>
                                onSelectConstituency({
                                  ...selectedConstituency,
                                  districtNumber: dNum,
                                })
                              }
                              className={`min-h-[32px] min-w-[34px] px-2 rounded-md text-xs font-mono tabular-nums font-semibold transition-colors ${
                                isCurrent
                                  ? 'bg-blue-700 text-white'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {dNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-600">พรรคครองฐานเสียงนำในภาคนี้:</span>
                      {dominantParty ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                          <PartyLogo party={dominantParty} size="xs" />
                          <span>{dominantParty.name}</span>
                        </span>
                      ) : (
                        <strong>-</strong>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <div className="font-sans text-[11px] text-slate-500">นิยมรัฐบาล</div>
                        <div className="font-bold text-slate-900">{selectedRegionData.govApproval}%</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <div className="font-sans text-[11px] text-slate-500">เศรษฐกิจ</div>
                        <div className="font-bold text-slate-900">
                          {selectedRegionData.localEconomyScore}/100
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <div className="font-sans text-[11px] text-slate-500">เขตรวมภาค</div>
                        <div className="font-bold text-slate-900">
                          {selectedRegionData.constituencySeats}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live 77-Province ECT Directory */}
                <div className="space-y-2.5 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px]">
                      <button
                        type="button"
                        onClick={() => setModalRegionScope('SELECTED_REGION')}
                        className={`min-h-[30px] px-2.5 py-0.5 rounded-md font-medium whitespace-nowrap ${
                          modalRegionScope === 'SELECTED_REGION'
                            ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        เฉพาะ{selectedRegionSpec.shortLabel} ({selectedRegionSpec.provincesCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalRegionScope('ALL_REGIONS')}
                        className={`min-h-[30px] px-2.5 py-0.5 rounded-md font-medium whitespace-nowrap ${
                          modalRegionScope === 'ALL_REGIONS'
                            ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ครบทั้ง 6 ภาค (77)
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={provinceSearch}
                      onChange={(e) => setProvinceSearch(e.target.value)}
                      placeholder="ค้นหาจังหวัดจากทั้ง 77 จังหวัด..."
                      className="w-full min-h-[40px] pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-y-auto max-h-64 lg:max-h-none lg:flex-1">
                    {modalReportSections.map(({ regSpec, gameReg, provs }) => (
                      <div key={regSpec.id}>
                        <div className="px-3.5 py-1.5 bg-slate-100 text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                          <span>
                            {regSpec.ectOrder}. {regSpec.name}
                          </span>
                          <span className="font-mono tabular-nums text-slate-500">
                            {regSpec.provincesCount} จ. · {gameReg?.constituencySeats ?? regSpec.constituencySeats400} เขต
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {provs.map((prov) => {
                            const isSel = selectedConstituency?.provinceCode === prov.code;
                            return (
                              <button
                                key={prov.code}
                                type="button"
                                onClick={() => focusOnProvince(prov, 1)}
                                className={`w-full min-h-[40px] px-3.5 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                                  isSel
                                    ? 'bg-blue-50/80 text-blue-900 font-semibold'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span>จังหวัด{prov.name}</span>
                                <span className="font-mono tabular-nums text-slate-500">
                                  {prov.districts.length} เขต
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
