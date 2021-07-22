export default interface State {
  cities: any[],
  area: {
    letleafEvent: Object | null,
    neighborhood: Object | null,
    city: Object | null,
  },
  form: AreaForm,
}

export interface AreaForm {
  name: { language: string, label: null }[];
  color: {
    active: null | string;
    hover: null | string;
    status: null | string;
  }
  mapTouched: boolean;
  mapData: null;
}