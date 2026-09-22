export type Tier = 'A' | 'B'
export type Area = 'AI' | 'ML' | 'Software Engineering' | 'Database' | 'Data Mining'

export type DeadlineStatus = 'official' | 'tba' | 'estimated'

export interface DeadlineCycle {
  label: string
  abstract?: string
  paper?: string
  timezone?: string
  status: DeadlineStatus
}

export interface Conference {
  id: string
  name: string
  fullName: string
  tier: Tier
  areas: Area[]
  templateFamily: 'IEEE' | 'ACM' | 'Springer' | 'AAAI' | 'Custom'
  templateUrl: string
  cfpUrl: string
  deadlines: DeadlineCycle[]
  notes?: string
}

export const conferences: Conference[] = [
  { id:'aaai', name:'AAAI', fullName:'AAAI Conference on Artificial Intelligence', tier:'A', areas:['AI'], templateFamily:'AAAI', templateUrl:'https://aaai.org/authorkit26/', cfpUrl:'https://aaai.org/conference/aaai/aaai-27/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'ijcai', name:'IJCAI', fullName:'International Joint Conference on Artificial Intelligence', tier:'A', areas:['AI'], templateFamily:'Custom', templateUrl:'https://www.ijcai.org/authors_kit', cfpUrl:'https://www.ijcai.org/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'cvpr', name:'CVPR', fullName:'IEEE/CVF Conference on Computer Vision and Pattern Recognition', tier:'A', areas:['AI','ML'], templateFamily:'IEEE', templateUrl:'https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines', cfpUrl:'https://cvpr.thecvf.com/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'iccv', name:'ICCV', fullName:'IEEE/CVF International Conference on Computer Vision', tier:'A', areas:['AI','ML'], templateFamily:'IEEE', templateUrl:'https://iccv.thecvf.com/', cfpUrl:'https://iccv.thecvf.com/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'neurips', name:'NeurIPS', fullName:'Conference on Neural Information Processing Systems', tier:'A', areas:['AI','ML'], templateFamily:'Custom', templateUrl:'https://neurips.cc/', cfpUrl:'https://neurips.cc/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'icml', name:'ICML', fullName:'International Conference on Machine Learning', tier:'A', areas:['ML','AI'], templateFamily:'Custom', templateUrl:'https://icml.cc/', cfpUrl:'https://icml.cc/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'acl', name:'ACL', fullName:'Annual Meeting of the Association for Computational Linguistics', tier:'A', areas:['AI','ML'], templateFamily:'Custom', templateUrl:'https://acl-org.github.io/ACLPUB/formatting.html', cfpUrl:'https://www.aclweb.org/portal/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'eccv', name:'ECCV', fullName:'European Conference on Computer Vision', tier:'B', areas:['AI','ML'], templateFamily:'Springer', templateUrl:'https://eccv.ecva.net/', cfpUrl:'https://eccv.ecva.net/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'emnlp', name:'EMNLP', fullName:'Conference on Empirical Methods in Natural Language Processing', tier:'B', areas:['AI','ML'], templateFamily:'Custom', templateUrl:'https://acl-org.github.io/ACLPUB/formatting.html', cfpUrl:'https://www.aclweb.org/portal/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'kdd', name:'KDD', fullName:'ACM SIGKDD Conference on Knowledge Discovery and Data Mining', tier:'A', areas:['Data Mining','ML'], templateFamily:'ACM', templateUrl:'https://www.acm.org/publications/proceedings-template', cfpUrl:'https://kdd.org/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'www', name:'WWW', fullName:'The Web Conference', tier:'A', areas:['Data Mining','AI'], templateFamily:'ACM', templateUrl:'https://www.acm.org/publications/proceedings-template', cfpUrl:'https://www2027.thewebconf.org/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'sigmod', name:'SIGMOD', fullName:'ACM SIGMOD International Conference on Management of Data', tier:'A', areas:['Database'], templateFamily:'ACM', templateUrl:'https://www.acm.org/publications/proceedings-template', cfpUrl:'https://2027.sigmod.org/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'vldb', name:'VLDB', fullName:'International Conference on Very Large Data Bases / PVLDB', tier:'A', areas:['Database'], templateFamily:'Custom', templateUrl:'https://www.vldb.org/pvldb/volumes/19/formatting/', cfpUrl:'https://www.vldb.org/', deadlines:[{label:'Rolling cycle',status:'tba'}], notes:'PVLDB frequently uses rolling monthly rounds rather than one annual paper deadline.' },
  { id:'icde', name:'ICDE', fullName:'IEEE International Conference on Data Engineering', tier:'A', areas:['Database'], templateFamily:'IEEE', templateUrl:'https://www.ieee.org/conferences/publishing/templates.html', cfpUrl:'https://icde2027.github.io/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'pods', name:'PODS', fullName:'ACM Symposium on Principles of Database Systems', tier:'B', areas:['Database'], templateFamily:'ACM', templateUrl:'https://www.acm.org/publications/proceedings-template', cfpUrl:'https://sigmod.org/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'cikm', name:'CIKM', fullName:'ACM International Conference on Information and Knowledge Management', tier:'B', areas:['Data Mining','Database'], templateFamily:'ACM', templateUrl:'https://www.acm.org/publications/proceedings-template', cfpUrl:'https://www.cikmconference.org/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'icdm', name:'ICDM', fullName:'IEEE International Conference on Data Mining', tier:'B', areas:['Data Mining','ML'], templateFamily:'IEEE', templateUrl:'https://www.ieee.org/conferences/publishing/templates.html', cfpUrl:'https://www.cs.uvm.edu/~icdm/', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'icse', name:'ICSE', fullName:'International Conference on Software Engineering', tier:'A', areas:['Software Engineering'], templateFamily:'ACM', templateUrl:'https://www.acm.org/publications/proceedings-template', cfpUrl:'https://conf.researchr.org/home/icse-2027', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'fse', name:'FSE', fullName:'ACM International Conference on the Foundations of Software Engineering', tier:'A', areas:['Software Engineering'], templateFamily:'ACM', templateUrl:'https://www.acm.org/publications/proceedings-template', cfpUrl:'https://conf.researchr.org/series/fse', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'ase', name:'ASE', fullName:'IEEE/ACM International Conference on Automated Software Engineering', tier:'A', areas:['Software Engineering'], templateFamily:'ACM', templateUrl:'https://www.acm.org/publications/proceedings-template', cfpUrl:'https://conf.researchr.org/series/ase', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'issta', name:'ISSTA', fullName:'ACM SIGSOFT International Symposium on Software Testing and Analysis', tier:'A', areas:['Software Engineering'], templateFamily:'ACM', templateUrl:'https://www.acm.org/publications/proceedings-template', cfpUrl:'https://conf.researchr.org/series/issta', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'icsme', name:'ICSME', fullName:'IEEE International Conference on Software Maintenance and Evolution', tier:'B', areas:['Software Engineering'], templateFamily:'IEEE', templateUrl:'https://www.ieee.org/conferences/publishing/templates.html', cfpUrl:'https://conf.researchr.org/series/icsme', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'saner', name:'SANER', fullName:'IEEE International Conference on Software Analysis, Evolution and Reengineering', tier:'B', areas:['Software Engineering'], templateFamily:'IEEE', templateUrl:'https://www.ieee.org/conferences/publishing/templates.html', cfpUrl:'https://conf.researchr.org/series/saner', deadlines:[{label:'Next cycle',status:'tba'}] },
  { id:'middleware', name:'Middleware', fullName:'ACM/IFIP International Middleware Conference', tier:'B', areas:['Software Engineering'], templateFamily:'ACM', templateUrl:'https://www.acm.org/publications/proceedings-template', cfpUrl:'https://middleware-conf.github.io/', deadlines:[{label:'Next cycle',status:'tba'}] }
]

export const areaOrder: Area[] = ['AI','ML','Software Engineering','Database','Data Mining']

export const outlineByArea: Record<Area, string[]> = {
  AI: ['Abstract','Introduction','Related Work','Method','Experiments','Analysis','Limitations','Conclusion'],
  ML: ['Abstract','Introduction','Related Work','Method','Theory / Objective','Experiments','Ablations','Limitations','Conclusion'],
  'Software Engineering': ['Abstract','Introduction','Background','Motivation / Problem','Approach','Implementation','Evaluation','Threats to Validity','Related Work','Conclusion'],
  Database: ['Abstract','Introduction','Background','Problem Definition','System / Method','Implementation','Experimental Evaluation','Related Work','Limitations','Conclusion'],
  'Data Mining': ['Abstract','Introduction','Related Work','Problem Definition','Method','Experimental Setup','Results','Ablation / Analysis','Limitations','Conclusion']
}
