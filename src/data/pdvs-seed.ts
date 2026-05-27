import type { PDV } from '../types'
import { slugify, fixMalformedCoordinate } from '../lib/geo'

const raw = [
  // ASESOR: FRANCISCO CARVAJAL
  { codigo: '501674086', nombre: 'RUTAS DESARROLLOS 1947', zona: 'GUATIRE', asesor: 'Francisco Carvajal', lat: '10.466733478751715', lon: '-66.56986407636016' },
  { codigo: '501694656', nombre: 'RUTAS DESARROLLOS 0101', zona: 'CARACAS', asesor: 'Francisco Carvajal', lat: '10.468432845820944', lon: '-66.81791715624628' },
  { codigo: '503706543', nombre: 'CAUCHOS AVILA', zona: 'CARACAS', asesor: 'Francisco Carvajal', lat: '10.490339278053588', lon: '-66.85439488072376' },
  { codigo: '502197931', nombre: 'RCR PERFORMANCE', zona: 'CARACAS', asesor: 'Francisco Carvajal', lat: '10.486393803235556', lon: '-66.89032382944674' },
  { codigo: '485615', nombre: 'ROYAL AUTORAMA', zona: 'CARACAS', asesor: 'Francisco Carvajal', lat: '10.489654622406844', lon: '-66.86830342202718' },
  { codigo: '298615737', nombre: 'MIX TIENDAS TREBOL', zona: 'CARACAS', asesor: 'Francisco Carvajal', lat: '10.489687346821693', lon: '-66.86846571081887' },
  { codigo: '305859493', nombre: 'SERVIAUTO LOLO', zona: 'CARACAS', asesor: 'Francisco Carvajal', lat: '10.4884074612034', lon: '-66.88216839240582' },
  { codigo: '503327707', nombre: 'ZIP MARKET', zona: 'CARACAS', asesor: 'Francisco Carvajal', lat: '10.449929933911887', lon: '-66.87588645306624' },
  { codigo: '313075035', nombre: 'TIRE CENTER LA BOYERA', zona: 'CARACAS', asesor: 'Francisco Carvajal', lat: '10.426398780125771', lon: '-66.83618193180571' },
  // ASESOR: JUVEMIR
  { codigo: '404012117', nombre: 'CAUCHERA PACAIRIGUA', zona: 'GUATIRE', asesor: 'Juvemir', lat: '10.4741161322996', lon: '-66.54696808553356' },
  { codigo: '413143470', nombre: 'INVERSIONES Y REPUESTOS LOUCARS', zona: 'GUATIRE', asesor: 'Juvemir', lat: '10.465929000684284', lon: '-66.57553985277207' },
  { codigo: '500546114', nombre: 'COMERCIALIZADORA IREMY', zona: 'CARACAS', asesor: 'Juvemir', lat: '10.497697793336313', lon: '-66.8826715804176' },
  { codigo: '50088115', nombre: 'DISTRIBUIDORA JJJ MERAKI', zona: 'CARACAS', asesor: 'Juvemir', lat: '10477126100030900', lon: '-6694370076693240' },
  { codigo: '502238344', nombre: 'MULTIMASI', zona: 'CARACAS', asesor: 'Juvemir', lat: '10.491971245054655', lon: '-66.8215539656759' },
  { codigo: '502607463', nombre: 'CARSMEC SANTA PAULA', zona: 'CARACAS', asesor: 'Juvemir', lat: '10.464063418799595', lon: '-66.83381637055157' },
  { codigo: '304966188', nombre: 'MANUEL ALEJANDRO SARAIVA MAYOR', zona: 'CARACAS', asesor: 'Juvemir', lat: '', lon: '' },
  { codigo: '503845538', nombre: 'MULTIMILLA', zona: 'SAN ANTONIO DE LOS ALTOS', asesor: 'Juvemir', lat: '10.3642682', lon: '-66.96465' },
  { codigo: '295607741', nombre: 'MOTO EXPRESS', zona: 'CARACAS', asesor: 'Juvemir', lat: '10.3746071', lon: '-66.9656573' },
  { codigo: '408881594', nombre: 'INVERSIONES MARQDAI', zona: 'SAN ANTONIO DE LOS ALTOS', asesor: 'Juvemir', lat: '10.374199680134701', lon: '-66.96111684577228' },
  { codigo: '311414654', nombre: 'DISTRIBUIDORA SHOPPER CENTER', zona: 'SAN ANTONIO DE LOS ALTOS', asesor: 'Juvemir', lat: '10.3659649', lon: '-66.9865265' },
  { codigo: '505701045', nombre: 'THE BIG MOTO CENTER', zona: 'LOS TEQUES', asesor: 'Juvemir', lat: '10.3395467', lon: '-67.0384062' },
  { codigo: '403194335', nombre: 'LUBRICANTES EL LICEO', zona: 'LOS TEQUES', asesor: 'Juvemir', lat: '10.3513905', lon: '-67.0399904' },
  { codigo: '197644539', nombre: 'MISLEB INVERSIONES', zona: 'LOS TEQUES', asesor: 'Juvemir', lat: '10.3466546', lon: '-67.042193' },
  { codigo: '502398180', nombre: 'CARPRESS STORE', zona: 'CARACAS', asesor: 'Juvemir', lat: '10.486679745778632', lon: '-66.88927853642527' },
  { codigo: '507530167', nombre: 'JC REPUESTOS', zona: 'CARABALLEDA', asesor: 'Juvemir', lat: '10618838563721100', lon: '-6685201617609220' },
  { codigo: '404315535', nombre: 'INVERSIONES SOLCAR', zona: 'CATIA LA MAR', asesor: 'Juvemir', lat: '10.604004337168828', lon: '-67.02941925410495' },
  { codigo: '1714553', nombre: 'FRENOS DAVSAN', zona: 'LA GUAIRA', asesor: 'Juvemir', lat: '10596845199995400', lon: '-6696555505509480' },
  { codigo: '500491620', nombre: 'AUTOSERVICIOS RONCANCIO', zona: 'LA GUAIRA', asesor: 'Juvemir', lat: '', lon: '' },
  { codigo: '298179058', nombre: 'POLANCO', zona: 'LA GUAIRA', asesor: 'Juvemir', lat: '', lon: '' },
  { codigo: '502634150', nombre: 'ANDY CARS', zona: 'LAS MAYAS', asesor: 'Juvemir', lat: 'No se encuentra', lon: 'No se encuentra' },
  { codigo: '402912773', nombre: 'DISTRIBUIDORA DE LUBRICANTES EL PILON', zona: 'VALLE/COCHE', asesor: 'Juvemir', lat: 'No se encuentra', lon: 'No se encuentra' },
  { codigo: '413281139', nombre: '7 CARS AUTOPARTES', zona: 'BARUTA', asesor: 'Juvemir', lat: '10.436019640538648', lon: '-66.8720690294475' },
  { codigo: '404978224', nombre: 'SUMINISTROS DIJS', zona: 'CARACAS', asesor: 'Juvemir', lat: '10.482908002899643', lon: '-66.82309756675637' },
  { codigo: '412617907', nombre: 'CENTRO DE LUBRICACION BBBS', zona: 'CARACAS', asesor: 'Juvemir', lat: '10.48365723799301', lon: '-66.90282721786524' },
  { codigo: '410270390', nombre: 'DISTRIBUIDORA VALVAL', zona: 'BARUTA', asesor: 'Juvemir', lat: '10.436336963047507', lon: '-66.8742351976379' },
  { codigo: '504146765', nombre: 'COMERCIALIZADORA AMORCI', zona: 'BARUTA', asesor: 'Juvemir', lat: '', lon: '' },
  { codigo: '502349146', nombre: 'MULTISERVICIOS EDS', zona: 'BARUTA', asesor: 'Juvemir', lat: '10433996774967000', lon: '-6687309072784930' },
  { codigo: '402275749', nombre: 'MOTORRAD CCS', zona: 'CHAGUARAMOS', asesor: 'Juvemir', lat: '10483642674677000', lon: '-6688949607683150' },
  { codigo: '305205744', nombre: 'LUBRICANTES Y ACCESORIOS LA PARROQUIA', zona: 'EL HATILLO', asesor: 'Juvemir', lat: '10.414278158820077', lon: '-66.8134961027725' },
  { codigo: '412889044', nombre: 'INVERSIONES FANARDO', zona: 'LAS MINAS', asesor: 'Juvemir', lat: '10.449388782942625', lon: '-66.85787225337027' },
  { codigo: '404466738', nombre: 'AUTOMECANICA MARILU', zona: 'LAS MINAS', asesor: 'Juvemir', lat: '10.44856068016395', lon: '-66.85770112883408' },
  { codigo: '405709979', nombre: 'INVERSIONES RMR', zona: 'JUNKITO', asesor: 'Juvemir', lat: '10.464387975196388', lon: '-67.06480757054912' },
  { codigo: '174383029', nombre: 'RICARDO DIAZ HERNANDEZ', zona: 'FLORIDA', asesor: 'Juvemir', lat: 'No se encuentra', lon: 'No se encuentra' },
  { codigo: '100397915', nombre: 'REINALDO MOTOR', zona: 'CANDELARIA', asesor: 'Juvemir', lat: 'No se encuentra', lon: 'No se encuentra' },
  { codigo: '501898855', nombre: 'MULTISERVICIOS TRIBOLOGY', zona: 'EL PARAISO', asesor: 'Juvemir', lat: '10.486694726933127', lon: '-66.94630876870146' },
  { codigo: '501427372', nombre: 'DISTRIBUIDORA CHINLLI', zona: 'CENTRO', asesor: 'Juvemir', lat: '10.495239381333851', lon: '-66.9124104993978' },
  { codigo: '410691093', nombre: 'MULTISERVICIOS TODO 4X4', zona: 'CARACAS', asesor: 'Juvemir', lat: '10.4822693', lon: '-66.8900008' },
  { codigo: '296448833', nombre: 'AUTOPERIQUITOS MORDIM', zona: 'GUATIRE', asesor: 'Juvemir', lat: 'No se encuentra', lon: 'No se encuentra' },
  { codigo: '283011379', nombre: 'YEIFRI MARQUEZ', zona: 'CARACAS', asesor: 'Juvemir', lat: 'No se encuentra', lon: 'No se encuentra' },
  { codigo: '500154690', nombre: 'GRUPO AZYC', zona: 'GUATIRE', asesor: 'Juvemir', lat: 'No se encuentra', lon: 'No se encuentra' },
  { codigo: '304876688', nombre: 'CAUCHOS CALIFORNIA', zona: 'CARACAS', asesor: 'Juvemir', lat: '10.478761785391272', lon: '-66.81703383766653' },
  { codigo: '408876060', nombre: 'CAR AUTO EL PARAISO', zona: 'CARACAS', asesor: 'Juvemir', lat: '10.491641811191297', lon: '-66.92544327714238' },
  // ASESOR: JOSSENY ROJAS
  { codigo: '100711890', nombre: 'COMERCIAL LUSMIR', zona: 'VALLES DEL TUY', asesor: 'Josseny Rojas', lat: '10.13922328873125', lon: '-66.88551974598472' },
  { codigo: '152314783', nombre: 'LUIS ALBERTO CONTRERAS', zona: 'SANTA TERESA', asesor: 'Josseny Rojas', lat: 'No se encuentra', lon: 'No se encuentra' },
  { codigo: '295857721', nombre: 'CAUCHOS Y REPUESTOS ARTURO', zona: 'CHARALLAVE', asesor: 'Josseny Rojas', lat: '10.260818592174068', lon: '-66.85403349751876' },
  { codigo: '297220232', nombre: 'LUBMIRANDA', zona: 'CUA', asesor: 'Josseny Rojas', lat: 'No se encuentra', lon: 'No se encuentra' },
  { codigo: '304991932', nombre: 'CRINEMARO', zona: 'STA. TERESA DEL TUY', asesor: 'Josseny Rojas', lat: '10.24469826656856', lon: '-66.66055363691044' },
  { codigo: '307281529', nombre: 'LUBRICAUCHERA MAITANA', zona: 'CHARALLAVE', asesor: 'Josseny Rojas', lat: 'No se encuentra', lon: 'No se encuentra' },
  { codigo: '317673859', nombre: 'INVERSIONES CATALDIESEL', zona: 'OCUMARE', asesor: 'Josseny Rojas', lat: '10.118109549869978', lon: '-66.78535417713083' },
  { codigo: '504783234', nombre: 'INVERSIONES TEAM NEYKER', zona: 'OCUMARE', asesor: 'Josseny Rojas', lat: '10.118941800868445', lon: '-66.77911338084637' },
  { codigo: '505791234', nombre: 'INVERSIONES CAUCHERA LB', zona: 'PARACOTOS', asesor: 'Josseny Rojas', lat: 'No se encuentra', lon: 'No se encuentra' },
]

const usedSlugs = new Set<string>()

function uniqueSlug(base: string): string {
  const slug = slugify(base)
  if (!usedSlugs.has(slug)) { usedSlugs.add(slug); return slug }
  let i = 2
  while (usedSlugs.has(`${slug}-${i}`)) i++
  usedSlugs.add(`${slug}-${i}`)
  return `${slug}-${i}`
}

export const LOCAL_PDVS: PDV[] = raw.map((r) => ({
  id: r.codigo,
  codigo: r.codigo,
  nombre: r.nombre,
  zona: r.zona,
  direccion: null,
  latitud: fixMalformedCoordinate(r.lat, true),
  longitud: fixMalformedCoordinate(r.lon, false),
  asesor_ventas: r.asesor,
  activo: true,
  slug: uniqueSlug(r.nombre),
  instagram: null,
  telefono: null,
  horario: null,
  imagen_url: null,
}))

export const ZONAS = [...new Set(LOCAL_PDVS.map((p) => p.zona))].sort()
