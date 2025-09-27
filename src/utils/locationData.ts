// Country -> regions (states/provinces or major regions) prototype dataset.
// Kept intentionally small. For production integrate a geo service or larger static dataset.
export interface CountryRegions { country: string; regions: string[] }

export const COUNTRY_REGION_DATA: CountryRegions[] = [
  { country: 'United States', regions: ['California', 'New York', 'Texas', 'Washington', 'Illinois', 'Georgia', 'Florida'] },
  { country: 'Canada', regions: ['Ontario', 'British Columbia', 'Quebec', 'Alberta', 'Manitoba'] },
  { country: 'United Kingdom', regions: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
  { country: 'Germany', regions: ['Bavaria', 'Berlin', 'Hesse', 'North Rhine-Westphalia', 'Hamburg'] },
  { country: 'France', regions: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Occitanie', 'Provence-Alpes-Côte d’Azur'] },
  { country: 'India', regions: ['Karnataka', 'Maharashtra', 'Delhi (NCT)', 'Telangana', 'Tamil Nadu'] },
  { country: 'Nigeria', regions: ['Lagos', 'Abuja (FCT)', 'Rivers', 'Oyo'] },
  { country: 'Brazil', regions: ['São Paulo', 'Rio de Janeiro', 'Brasília (DF)', 'Minas Gerais'] },
  { country: 'Australia', regions: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia'] },
  { country: 'Japan', regions: ['Tokyo', 'Osaka', 'Kyoto', 'Kanagawa'] },
  { country: 'Kenya', regions: ['Nairobi County', 'Mombasa County', 'Kisumu County'] },
  { country: 'South Africa', regions: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'] },
  { country: 'Spain', regions: ['Madrid', 'Catalonia', 'Valencian Community'] },
  { country: 'Mexico', regions: ['Ciudad de México', 'Jalisco', 'Nuevo León'] },
  { country: 'Netherlands', regions: ['North Holland', 'South Holland', 'Utrecht'] },
  { country: 'Singapore', regions: ['Singapore'] },
  { country: 'United Arab Emirates', regions: ['Dubai', 'Abu Dhabi'] },
  { country: 'Philippines', regions: ['Metro Manila', 'Cebu', 'Davao del Sur'] },
  { country: 'Global / Remote', regions: ['Remote'] },
  { country: 'Other', regions: ['Other'] }
];

export function getCountries(): string[] { return COUNTRY_REGION_DATA.map(c => c.country); }
export function getRegions(country: string): string[] {
  const entry = COUNTRY_REGION_DATA.find(c => c.country === country);
  return entry ? entry.regions : [];
}

// Backward compatibility: original API name used in components before change
export const getCities = getRegions;
