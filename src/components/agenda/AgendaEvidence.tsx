'use client'

import { FormEvent, useState } from 'react'

import { useEvidences } from '@/lib/agenda/hooks/useEvidences'

type EvidenceType = 'texto' | 'imagem' | 'pdf' | 'link'

type EvidenceFormState = {
  title: string
  description: string
  evidenceType: EvidenceType
  externalUrl: string
}

const initialForm: EvidenceFormState = {
  title: '',
  description: '',
  evidenceType: 'texto',
  externalUrl: '',
}

export function AgendaEvidence() {
  const {
    evidences,
    loading,
    error,
    reload,
    createEvidence,
    uploadEvidence,
  } = useEvidences()

  const [form, setForm] = useState<EvidenceFormState>(initialForm)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    null,
  )

  function handleEvidenceTypeChange(value: EvidenceType): void {
    setForm((current) => ({
      ...current,
      evidenceType: value,
      externalUrl: value === 'link' ? current.externalUrl : '',
    }))

    setSelectedFile(null)
    setFileInputKey((current) => current + 1)
    setFormError(null)
    setSuccessMessage(null)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)

    try {
      let fileUrl: string | null = null

      if (
        form.evidenceType === 'imagem' ||
        form.evidenceType === 'pdf'
      ) {
        if (!selectedFile) {
          throw new Error('Selecione um arquivo para enviar.')
        }

        fileUrl = await uploadEvidence(selectedFile)

        if (!fileUrl) {
          throw new Error(
            'O arquivo foi enviado, mas nenhuma URL foi retornada.',
          )
        }
      }

      if (
        form.evidenceType === 'link' &&
        !form.externalUrl.trim()
      ) {
        throw new Error('Informe o link externo da evidência.')
      }

      await createEvidence({
        title: form.title,
        description: form.description || null,
        evidence_type: form.evidenceType,
        file_url: fileUrl,
        external_url:
          form.evidenceType === 'link'
            ? form.externalUrl.trim()
            : null,
      })

      setForm(initialForm)
      setSelectedFile(null)
      setFileInputKey((current) => current + 1)
      setSuccessMessage('Evidência criada com sucesso.')
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar a evidência.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Evidências pedagógicas
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Registre práticas, produções, documentos e resultados com
          armazenamento seguro no Supabase.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-slate-950">
              Nova evidência
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="evidence-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Título
                </label>

                <input
                  id="evidence-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="evidence-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Descrição
                </label>

                <textarea
                  id="evidence-description"
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="evidence-type"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Tipo
                </label>

                <select
                  id="evidence-type"
                  value={form.evidenceType}
                  onChange={(event) =>
                    handleEvidenceTypeChange(
                      event.target.value as EvidenceType,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                >
                  <option value="texto">Texto</option>
                  <option value="imagem">Imagem</option>
                  <option value="pdf">PDF</option>
                  <option value="link">Link</option>
                </select>
              </div>

              {(form.evidenceType === 'imagem' ||
                form.evidenceType === 'pdf') && (
                <div>
                  <label
                    htmlFor="evidence-file"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Arquivo
                  </label>

                  <input
                    key={fileInputKey}
                    id="evidence-file"
                    type="file"
                    required
                    accept={
                      form.evidenceType === 'imagem'
                        ? 'image/jpeg,image/png,image/webp'
                        : 'application/pdf'
                    }
                    onChange={(event) =>
                      setSelectedFile(
                        event.target.files?.[0] ?? null,
                      )
                    }
                    className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[#5C1A8C] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90"
                  />

                  <p className="mt-2 text-sm text-slate-500">
                    {form.evidenceType === 'imagem'
                      ? 'Formatos aceitos: JPG, PNG ou WEBP. Máximo de 10 MB.'
                      : 'Formato aceito: PDF. Máximo de 10 MB.'}
                  </p>

                  {selectedFile ? (
                    <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  ) : null}
                </div>
              )}

              {form.evidenceType === 'link' && (
                <div>
                  <label
                    htmlFor="evidence-external-url"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Link externo
                  </label>

                  <input
                    id="evidence-external-url"
                    type="url"
                    required
                    value={form.externalUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        externalUrl: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>

            {formError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {formError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-[#5C1A8C] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Enviando e salvando...'
                : 'Criar evidência'}
            </button>
          </form>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-950">
                Evidências cadastradas
              </h2>

              <button
                type="button"
                onClick={() => void reload()}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Atualizar
              </button>
            </div>

            {loading ? (
              <p className="mt-8 text-slate-600">
                Carregando evidências...
              </p>
            ) : null}

            {error ? (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
              </div>
            ) : null}

            {!loading && !error && evidences.length === 0 ? (
              <p className="mt-8 text-slate-500">
                Nenhuma evidência cadastrada.
              </p>
            ) : null}

            <div className="mt-8 space-y-5">
              {evidences.map((evidence) => (
                <article
                  key={evidence.id}
                  className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                        {evidence.evidence_type}
                      </p>

                      <h3 className="mt-3 text-xl font-bold text-slate-950">
                        {evidence.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-[#081C2E] px-4 py-2 text-xs font-bold text-white">
                      {new Date(
                        evidence.created_at,
                      ).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {evidence.description ? (
                    <p className="mt-4 leading-7 text-slate-600">
                      {evidence.description}
                    </p>
                  ) : null}

                  {evidence.file_url ? (
                    <a
                      href={evidence.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex font-semibold text-[#5C1A8C] hover:underline"
                    >
                      Abrir arquivo
                    </a>
                  ) : null}

                  {evidence.external_url ? (
                    <a
                      href={evidence.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex font-semibold text-[#5C1A8C] hover:underline"
                    >
                      Abrir link
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}