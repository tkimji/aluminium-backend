import path from 'path';
import { Router } from 'express';
import fs from 'fs';

type Province = { id: number; name_th: string; name_en: string };
type District = { id: number; province_id: number; name_th: string; name_en: string };
type SubDistrict = {
  id: number;
  district_id: number;
  province_id: number;
  name_th: string;
  name_en: string;
  zip_code: number;
};

const dataDir = path.join(process.cwd(), 'prisma', 'data');

const provinces: Province[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'provinces.json'), 'utf-8')
);
const districts: District[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'districts.json'), 'utf-8')
);
const subDistricts: SubDistrict[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'sub_districts.json'), 'utf-8')
);

const matchesSearch = (value: string, search: string) =>
  value.toLowerCase().includes(search.toLowerCase());

export const locationsRouter = Router();

locationsRouter.get('/provinces', (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const result = search
    ? provinces.filter(
        (item) => matchesSearch(item.name_th, search) || matchesSearch(item.name_en, search)
      )
    : provinces;

  res.json({ data: result });
});

locationsRouter.get('/districts', (req, res) => {
  const provinceId = Number(req.query.provinceId);
  const search = String(req.query.search ?? '').trim();

  if (!provinceId) {
    res.status(400).json({ message: 'provinceId is required' });
    return;
  }

  const base = districts.filter((item) => item.province_id === provinceId);
  const result = search
    ? base.filter(
        (item) => matchesSearch(item.name_th, search) || matchesSearch(item.name_en, search)
      )
    : base;

  res.json({ data: result });
});

locationsRouter.get('/sub-districts', (req, res) => {
  const districtId = Number(req.query.districtId);
  const search = String(req.query.search ?? '').trim();

  if (!districtId) {
    res.status(400).json({ message: 'districtId is required' });
    return;
  }

  const base = subDistricts.filter((item) => item.district_id === districtId);
  const result = search
    ? base.filter(
        (item) => matchesSearch(item.name_th, search) || matchesSearch(item.name_en, search)
      )
    : base;

  res.json({ data: result });
});

locationsRouter.get('/postal-codes', (req, res) => {
  const subDistrictId = Number(req.query.subDistrictId);

  if (!subDistrictId) {
    res.status(400).json({ message: 'subDistrictId is required' });
    return;
  }

  const item = subDistricts.find((row) => row.id === subDistrictId);
  if (!item) {
    res.status(404).json({ message: 'Sub-district not found' });
    return;
  }

  res.json({ data: { zip_code: item.zip_code } });
});
