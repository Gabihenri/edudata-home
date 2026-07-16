import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'
import {
  createReadStream,
  existsSync,
} from 'node:fs'
import { basename, resolve } from 'node:path'
import { StringDecoder } from 'node:string_decoder'

type RegistryPayload = {
  inep_code: string
  name: string
  state: string | null
  city: string | null
  service_restriction: string | null
  location: string | null
  differentiated_location: string | null
  administrative_category: string | null
  address: string | null
  phone: string | null
  administrative_dependency: string | null
  private_school_category: string | null
  public_authority_partner: string | null
  education_council_regulation: string | null
  school_size: string | null
  education_stages: string | null
  other_educational_offerings: string | null
  latitude: number | null
  longitude: number | null
  source_file: string
  imported_at: string
}

type ImportStatistics = {
  totalRead: number
  valid: number
  ignored: number
  imported: number
  batches: number
  errors: number
}

type CsvRecordHandler = (
  record: string[],
  lineNumber: number,
) => Promise<void>

const DEFAULT_BATCH_SIZE = 500

const EXPECTED_HEADERS = [
  'Restrição de Atendimento',
  'Escola',
  'Código INEP',
  'UF',
  'Município',
  'Localização',
  'Localidade Diferenciada',
  'Categoria Administrativa',
  'Endereço',
  'Telefone',
  'Dependência Administrativa',
  'Categoria Escola Privada',
  'Conveniada Poder Público',
  'Regulamentação pelo Conselho de Educação',
  'Porte da Escola',
  'Etapas e Modalidade de Ensino Oferecidas',
  'Outras Ofertas Educacionais',
  'Latitude',
  'Longitude',
] as const

function createSupabaseClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL não configurada.',
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada.',
    )
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

function normalizeHeader(
  value: string,
): string {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
}

function normalizeText(
  value: string | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()

  if (
    !normalized ||
    normalized.toLowerCase() ===
      'não informado'
  ) {
    return null
  }

  return normalized
}

function normalizeInepCode(
  value: string | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const digits = value.replace(/\D/g, '')

  if (digits.length !== 8) {
    return null
  }

  return digits
}

function normalizeState(
  value: string | undefined,
): string | null {
  const normalized =
    normalizeText(value)?.toUpperCase() ??
    null

  if (
    !normalized ||
    !/^[A-Z]{2}$/.test(normalized)
  ) {
    return null
  }

  return normalized
}

function normalizeCoordinate(
  value: string | undefined,
  minimum: number,
  maximum: number,
): number | null {
  const normalized =
    normalizeText(value)

  if (!normalized) {
    return null
  }

  const numericValue = Number(
    normalized.replace(',', '.'),
  )

  if (
    !Number.isFinite(numericValue) ||
    numericValue < minimum ||
    numericValue > maximum
  ) {
    return null
  }

  return numericValue
}

function getBatchSize(): number {
  const argument =
    process.argv.find((item) =>
      item.startsWith('--batch-size='),
    )

  if (!argument) {
    return DEFAULT_BATCH_SIZE
  }

  const value = Number(
    argument.split('=')[1],
  )

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > 1000
  ) {
    throw new Error(
      'O tamanho do lote deve ser um número inteiro entre 1 e 1000.',
    )
  }

  return value
}

function getCsvPath(): string {
  const argument = process.argv
    .slice(2)
    .find(
      (item) =>
        !item.startsWith('--'),
    )

  if (!argument) {
    throw new Error(
      [
        'Informe o caminho do CSV.',
        '',
        'Exemplo:',
        'npx tsx src/scripts/import-school-registry.ts "./dados/escolas.csv"',
      ].join('\n'),
    )
  }

  const csvPath = resolve(argument)

  if (!existsSync(csvPath)) {
    throw new Error(
      `Arquivo não encontrado: ${csvPath}`,
    )
  }

  if (
    !csvPath.toLowerCase().endsWith('.csv')
  ) {
    throw new Error(
      'O arquivo informado deve possuir extensão .csv.',
    )
  }

  return csvPath
}

function buildHeaderIndexes(
  headers: string[],
): Map<string, number> {
  const indexes = new Map<
    string,
    number
  >()

  headers.forEach(
    (header, index) => {
      indexes.set(
        normalizeHeader(header),
        index,
      )
    },
  )

  const missingHeaders =
    EXPECTED_HEADERS.filter(
      (header) =>
        !indexes.has(header),
    )

  if (missingHeaders.length > 0) {
    throw new Error(
      [
        'O CSV não possui todas as colunas esperadas.',
        `Colunas ausentes: ${missingHeaders.join(', ')}`,
      ].join('\n'),
    )
  }

  return indexes
}

function readColumn(
  record: string[],
  indexes: Map<string, number>,
  header: typeof EXPECTED_HEADERS[number],
): string | undefined {
  const index = indexes.get(header)

  if (index === undefined) {
    return undefined
  }

  return record[index]
}

function mapCsvRecord(
  record: string[],
  indexes: Map<string, number>,
  sourceFile: string,
  importedAt: string,
): RegistryPayload | null {
  const inepCode =
    normalizeInepCode(
      readColumn(
        record,
        indexes,
        'Código INEP',
      ),
    )

  const name =
    normalizeText(
      readColumn(
        record,
        indexes,
        'Escola',
      ),
    )

  if (!inepCode || !name) {
    return null
  }

  return {
    inep_code: inepCode,
    name,
    state:
      normalizeState(
        readColumn(
          record,
          indexes,
          'UF',
        ),
      ),
    city:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Município',
        ),
      ),
    service_restriction:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Restrição de Atendimento',
        ),
      ),
    location:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Localização',
        ),
      ),
    differentiated_location:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Localidade Diferenciada',
        ),
      ),
    administrative_category:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Categoria Administrativa',
        ),
      ),
    address:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Endereço',
        ),
      ),
    phone:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Telefone',
        ),
      ),
    administrative_dependency:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Dependência Administrativa',
        ),
      ),
    private_school_category:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Categoria Escola Privada',
        ),
      ),
    public_authority_partner:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Conveniada Poder Público',
        ),
      ),
    education_council_regulation:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Regulamentação pelo Conselho de Educação',
        ),
      ),
    school_size:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Porte da Escola',
        ),
      ),
    education_stages:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Etapas e Modalidade de Ensino Oferecidas',
        ),
      ),
    other_educational_offerings:
      normalizeText(
        readColumn(
          record,
          indexes,
          'Outras Ofertas Educacionais',
        ),
      ),
    latitude:
      normalizeCoordinate(
        readColumn(
          record,
          indexes,
          'Latitude',
        ),
        -90,
        90,
      ),
    longitude:
      normalizeCoordinate(
        readColumn(
          record,
          indexes,
          'Longitude',
        ),
        -180,
        180,
      ),
    source_file: sourceFile,
    imported_at: importedAt,
  }
}

async function processCsvFile(
  filePath: string,
  handler: CsvRecordHandler,
): Promise<void> {
  const stream = createReadStream(
    filePath,
  )

  const decoder =
    new StringDecoder('utf8')

  let field = ''
  let record: string[] = []
  let insideQuotes = false
  let pendingQuote = false
  let lineNumber = 1

  async function emitRecord() {
    record.push(field)

    const emittedRecord = record

    field = ''
    record = []

    const isEmpty =
      emittedRecord.every(
        (value) => !value.trim(),
      )

    if (!isEmpty) {
      await handler(
        emittedRecord,
        lineNumber,
      )
    }
  }

  async function processChunk(
    chunk: string,
  ) {
    for (
      let index = 0;
      index < chunk.length;
      index += 1
    ) {
      const character = chunk[index]

      if (pendingQuote) {
        if (character === '"') {
          field += '"'
          pendingQuote = false
          continue
        }

        insideQuotes = false
        pendingQuote = false
      }

      if (insideQuotes) {
        if (character === '"') {
          pendingQuote = true
        } else {
          field += character

          if (character === '\n') {
            lineNumber += 1
          }
        }

        continue
      }

      if (character === '"') {
        insideQuotes = true
        continue
      }

      if (character === ',') {
        record.push(field)
        field = ''
        continue
      }

      if (character === '\r') {
        continue
      }

      if (character === '\n') {
        await emitRecord()
        lineNumber += 1
        continue
      }

      field += character
    }
  }

  for await (const buffer of stream) {
    await processChunk(
      decoder.write(buffer),
    )
  }

  await processChunk(decoder.end())

  if (pendingQuote) {
    insideQuotes = false
    pendingQuote = false
  }

  if (
    insideQuotes ||
    field.length > 0 ||
    record.length > 0
  ) {
    await emitRecord()
  }
}

async function importBatch(
  supabase: SupabaseClient,
  batch: RegistryPayload[],
): Promise<number> {
  if (batch.length === 0) {
    return 0
  }

  const { error } = await supabase
    .from('school_registry')
    .upsert(batch, {
      onConflict: 'inep_code',
      ignoreDuplicates: false,
    })

  if (error) {
    throw new Error(
      `Erro no lote: ${error.message}`,
    )
  }

  return batch.length
}

async function main() {
  const csvPath = getCsvPath()
  const batchSize = getBatchSize()
  const sourceFile = basename(csvPath)
  const importedAt =
    new Date().toISOString()

  const supabase =
    createSupabaseClient()

  const statistics: ImportStatistics = {
    totalRead: 0,
    valid: 0,
    ignored: 0,
    imported: 0,
    batches: 0,
    errors: 0,
  }

  let headers:
    Map<string, number> | null = null

  let batch: RegistryPayload[] = []

  async function flushBatch() {
    if (batch.length === 0) {
      return
    }

    const currentBatch = batch
    batch = []

    try {
      const imported =
        await importBatch(
          supabase,
          currentBatch,
        )

      statistics.imported += imported
      statistics.batches += 1

      console.log(
        [
          `Lote ${statistics.batches}`,
          `${imported} registros`,
          `total importado: ${statistics.imported}`,
        ].join(' | '),
      )
    } catch (error) {
      statistics.errors +=
        currentBatch.length

      console.error(
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao importar lote.',
      )

      throw error
    }
  }

  console.log(
    `Arquivo: ${csvPath}`,
  )
  console.log(
    `Lote: ${batchSize} registros`,
  )
  console.log(
    'Iniciando importação...',
  )

  await processCsvFile(
    csvPath,
    async (record, lineNumber) => {
      if (!headers) {
        headers =
          buildHeaderIndexes(record)

        console.log(
          `Cabeçalho validado com ${record.length} colunas.`,
        )

        return
      }

      statistics.totalRead += 1

      const payload =
        mapCsvRecord(
          record,
          headers,
          sourceFile,
          importedAt,
        )

      if (!payload) {
        statistics.ignored += 1

        console.warn(
          `Linha ${lineNumber} ignorada: INEP ou nome inválido.`,
        )

        return
      }

      statistics.valid += 1
      batch.push(payload)

      if (
        batch.length >= batchSize
      ) {
        await flushBatch()
      }
    },
  )

  await flushBatch()

  console.log('')
  console.log(
    'Importação concluída.',
  )
  console.table({
    'Total lido':
      statistics.totalRead,
    'Registros válidos':
      statistics.valid,
    'Importados ou atualizados':
      statistics.imported,
    Ignorados:
      statistics.ignored,
    'Lotes processados':
      statistics.batches,
    Erros:
      statistics.errors,
  })

  if (statistics.errors > 0) {
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  console.error('')
  console.error(
    'Falha na importação:',
  )
  console.error(
    error instanceof Error
      ? error.message
      : error,
  )

  process.exitCode = 1
})