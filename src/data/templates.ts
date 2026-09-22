import type { Conference } from './conferences'

export interface TemplatePreset {
  family: Conference['templateFamily']
  className: string
  preamble: string[]
  notes: string[]
}

export const templatePresets: Record<Conference['templateFamily'], TemplatePreset> = {
  ACM: {
    family: 'ACM',
    className: '\\documentclass[sigconf,anonymous,review]{acmart}',
    preamble: ['\\usepackage{booktabs}', '\\usepackage{graphicx}', '\\usepackage{amsmath}', '\\usepackage{hyperref}'],
    notes: ['Use the official ACM class files from the selected venue.', 'Keep anonymity and review options aligned with the current CFP.']
  },
  IEEE: {
    family: 'IEEE',
    className: '\\documentclass[conference]{IEEEtran}',
    preamble: ['\\usepackage{graphicx}', '\\usepackage{amsmath,amssymb}', '\\usepackage{booktabs}', '\\usepackage{hyperref}'],
    notes: ['Use the official IEEE author kit for final formatting.', 'Double-check page limits and anonymization rules for the venue.']
  },
  Springer: {
    family: 'Springer',
    className: '\\documentclass[runningheads]{llncs}',
    preamble: ['\\usepackage{graphicx}', '\\usepackage{booktabs}', '\\usepackage{amsmath}', '\\usepackage{hyperref}'],
    notes: ['Replace this skeleton with the official LNCS package distributed by the venue.']
  },
  AAAI: {
    family: 'AAAI',
    className: '\\documentclass[letterpaper]{article}',
    preamble: ['% Load the official AAAI style file from the author kit.', '\\usepackage{graphicx}', '\\usepackage{amsmath}', '\\usepackage{booktabs}'],
    notes: ['AAAI formatting changes by edition; always download the current author kit.']
  },
  Custom: {
    family: 'Custom',
    className: '\\documentclass{article}',
    preamble: ['\\usepackage{graphicx}', '\\usepackage{amsmath,amssymb}', '\\usepackage{booktabs}', '\\usepackage{hyperref}'],
    notes: ['This is a neutral skeleton. Replace it with the venue-specific official template before submission.']
  }
}

export function buildLatexProject(conference: Conference, sections: string[], drafts: Record<string,string>) {
  const preset = templatePresets[conference.templateFamily]
  const body = sections.map((name) => {
    const key = conference.id + ':' + name
    const text = drafts[key] || ''
    if (name === 'Abstract') return '\\begin{abstract}\n' + text + '\n\\end{abstract}'
    return '\\section{' + name + '}\n' + text
  }).join('\n\n')

  return [
    preset.className,
    ...preset.preamble,
    '',
    '\\title{PaperForge Draft}',
    '\\author{Anonymous Authors}',
    '',
    '\\begin{document}',
    '\\maketitle',
    '',
    body,
    '',
    '\\bibliographystyle{plain}',
    '\\bibliography{references}',
    '\\end{document}',
  ].join('\n')
}
