export type JobCategory = "system-administration" | "system-support" | "system-developer";

export interface JobOpening {
  id: string;
  slug: string;
  title: string;
  company: string;
  category: JobCategory;
  categoryLabel: string;
  workMode: "remote" | "hybrid" | "contract";
  workModeLabel: string;
  location: string;
  salary: string;
  experienceLevel: "Junior" | "Mid-Level" | "Senior" | "Lead";
  jobType: "Full-Time" | "Part-Time" | "Contract";
  deadline: string;
  postedDate: string;
  applyUrl: string;
  summary: string;
  skills: string[];
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  ethiopiaFriendly: boolean;
  featured?: boolean;
}

export const CATEGORY_INFO: Record<JobCategory, { title: string; description: string; badge: string }> = {
  "system-administration": {
    title: "System Administration Jobs (Online / Remote)",
    description: "Cloud, Linux, Unix, server hardening, Kubernetes, DevOps, and automated infrastructure jobs open for remote work.",
    badge: "SysAdmin & Cloud Ops",
  },
  "system-support": {
    title: "System Support & IT Operations Jobs (Online / Remote)",
    description: "Tier 1-3 technical support, system troubleshooting, network diagnostics, and IT service desk remote roles.",
    badge: "IT & Systems Support",
  },
  "system-developer": {
    title: "System Developer & Software Engineer Jobs (Online / Remote)",
    description: "Backend architecture, full-stack development, Python, Go, TypeScript, distributed systems, and API engineering.",
    badge: "Systems & Software Dev",
  },
};

export const JOBS_LIST: JobOpening[] = [
  // ================= SYSTEM ADMINISTRATION =================
  {
    id: "job-sysadmin-01",
    slug: "remote-linux-systems-administrator",
    title: "Remote Linux Systems Administrator",
    company: "CloudOps Worldwide",
    category: "system-administration",
    categoryLabel: "System Administration",
    workMode: "remote",
    workModeLabel: "100% Online / Remote",
    location: "Global Remote (Ethiopia / Africa Eligible)",
    salary: "$3,000 - $4,800 / month",
    experienceLevel: "Mid-Level",
    jobType: "Full-Time",
    deadline: "2026-11-30",
    postedDate: "2026-10-10",
    applyUrl: "https://remoteok.com",
    summary: "Manage, monitor, and scale distributed Ubuntu and RHEL clusters. Automate configuration management, backups, and security patching across cloud and bare-metal environments.",
    skills: ["Linux (Ubuntu/Debian/RHEL)", "Bash Scripting", "Nginx", "Docker", "Prometheus", "Grafana", "Security Hardening"],
    responsibilities: [
      "Maintain 99.95% uptime across production server clusters.",
      "Automate repetitive operational tasks using Bash and Python scripts.",
      "Manage SSL/TLS certificates, firewalls (iptables/ufw), and VPN configurations.",
      "Conduct regular disaster recovery drills and database snapshot verifications.",
      "Respond to high-severity monitoring alerts and root-cause incidents."
    ],
    requirements: [
      "3+ years of professional Linux server administration experience.",
      "Strong understanding of networking protocols (TCP/IP, DNS, DHCP, HTTP/S).",
      "Hands-on experience with containerization (Docker) and process supervisors.",
      "Fluent English communication skills for asynchronous international teamwork.",
      "Stable high-speed internet connection suitable for remote SSH & VPN operations."
    ],
    benefits: [
      "100% remote asynchronous flexibility.",
      "Home office setup equipment allowance ($1,000 USD).",
      "Annual technical certification reimbursement (RHCSA, AWS, CKA).",
      "25 days of paid annual vacation plus public holidays."
    ],
    ethiopiaFriendly: true,
    featured: true,
  },
  {
    id: "job-sysadmin-02",
    slug: "cloud-infrastructure-devops-admin",
    title: "Cloud Infrastructure & DevOps Administrator",
    company: "Apex Scale Tech",
    category: "system-administration",
    categoryLabel: "System Administration",
    workMode: "remote",
    workModeLabel: "100% Online / Remote",
    location: "Remote (Worldwide / GMT-2 to GMT+4)",
    salary: "$3,800 - $5,500 / month",
    experienceLevel: "Senior",
    jobType: "Full-Time",
    deadline: "2026-12-15",
    postedDate: "2026-10-08",
    applyUrl: "https://weworkremotely.com",
    summary: "Lead multi-cloud provisioning using Terraform, Kubernetes, and AWS/GCP. Build reliable CI/CD release pipelines and ensure zero-downtime microservice deployments.",
    skills: ["AWS", "Terraform", "Kubernetes", "CI/CD (GitHub Actions)", "Linux", "Helm", "CloudWatch"],
    responsibilities: [
      "Architect and provision infrastructure-as-code using Terraform and GitOps.",
      "Maintain Kubernetes clusters and manage horizontal pod autoscaling.",
      "Partner with developers to streamline deployment pipelines and reduce build times.",
      "Implement SOC2 compliance, IAM policies, and cloud cost-optimization strategies."
    ],
    requirements: [
      "4+ years administering cloud environments (AWS, GCP, or Azure).",
      "Solid track record with Infrastructure as Code (Terraform or CloudFormation).",
      "Production experience running container workloads on Kubernetes.",
      "Proactive mindset towards automated testing and self-healing systems."
    ],
    benefits: [
      "Competitive USD monthly direct wire or crypto payout.",
      "Flexible working hours across East Africa and European time zones.",
      "Professional development budget and conference ticket stipends."
    ],
    ethiopiaFriendly: true,
    featured: true,
  },
  {
    id: "job-sysadmin-03",
    slug: "database-systems-administrator",
    title: "Database Systems Administrator (PostgreSQL & Linux)",
    company: "FinData International",
    category: "system-administration",
    categoryLabel: "System Administration",
    workMode: "remote",
    workModeLabel: "100% Online / Remote",
    location: "Remote Global",
    salary: "$3,200 - $5,000 / month",
    experienceLevel: "Mid-Level",
    jobType: "Full-Time",
    deadline: "2026-11-20",
    postedDate: "2026-10-12",
    applyUrl: "https://wellfound.com",
    summary: "Oversee high-availability PostgreSQL clusters, perform query optimization, connection pooling, and automated replication across geodistributed data centers.",
    skills: ["PostgreSQL", "PgBouncer", "Linux OS Tuning", "WAL Archiving", "SQL Performance", "Backup Automation"],
    responsibilities: [
      "Configure streaming replication, failover mechanisms, and backup verification.",
      "Analyze slow queries, index fragmentation, and database engine locks.",
      "Tune kernel parameters and disk I/O on Ubuntu servers hosting high-load databases."
    ],
    requirements: [
      "Proven experience in PostgreSQL administration in production environments.",
      "Familiarity with replication topologies and high availability setups.",
      "Strong command line scripting abilities (Bash / Python)."
    ],
    benefits: [
      "Annual performance bonus.",
      "Generous health & wellness stipend.",
      "Collaborative, respectful global engineering team culture."
    ],
    ethiopiaFriendly: true,
    featured: false,
  },

  // ================= SYSTEM SUPPORT =================
  {
    id: "job-support-01",
    slug: "remote-it-systems-support-specialist",
    title: "Remote IT Systems Support Specialist (Tier 2/3)",
    company: "OmniTech Global Services",
    category: "system-support",
    categoryLabel: "System Support",
    workMode: "remote",
    workModeLabel: "100% Online / Remote",
    location: "Remote Worldwide (Any timezone)",
    salary: "$1,800 - $3,000 / month",
    experienceLevel: "Mid-Level",
    jobType: "Full-Time",
    deadline: "2026-11-25",
    postedDate: "2026-10-11",
    applyUrl: "https://remoteok.com",
    summary: "Provide Tier 2/3 systems support for distributed staff and enterprise clients. Troubleshoot VPN access, SSO authentication, network latency, and OS workstations remotely.",
    skills: ["Active Directory", "Okta/SSO", "TCP/IP & VPN", "Jira Service Desk", "Windows/macOS Diagnostics", "SLA Management"],
    responsibilities: [
      "Diagnose and resolve escalated technical tickets within agreed SLA deadlines.",
      "Provision and de-provision user identities, OAuth permissions, and enterprise access.",
      "Create clear step-by-step technical documentation and user self-service guides.",
      "Collaborate with network engineers to pinpoint WAN and cloud gateway issues."
    ],
    requirements: [
      "2+ years experience in technical support, helpdesk, or desktop engineering.",
      "Familiarity with enterprise identity systems (Azure AD / Okta / Google Workspace).",
      "Exceptional empathy, problem-solving patience, and written English capability.",
      "A quiet dedicated remote workstation with reliable fiber/LTE internet."
    ],
    benefits: [
      "Work from anywhere in Ethiopia or abroad.",
      "Monthly internet connectivity allowance.",
      "Structured career path toward DevOps and Cloud Engineering.",
      "Comprehensive paid training and certification support."
    ],
    ethiopiaFriendly: true,
    featured: true,
  },
  {
    id: "job-support-02",
    slug: "cloud-systems-support-analyst",
    title: "Cloud Systems & Application Support Analyst",
    company: "SaaSConnect Platform",
    category: "system-support",
    categoryLabel: "System Support",
    workMode: "remote",
    workModeLabel: "100% Online / Remote",
    location: "Global Remote (Africa / Middle East / Europe)",
    salary: "$2,200 - $3,600 / month",
    experienceLevel: "Junior",
    jobType: "Full-Time",
    deadline: "2026-12-05",
    postedDate: "2026-10-13",
    applyUrl: "https://weworkremotely.com",
    summary: "Investigate customer application anomalies, review server log files using Datadog/Splunk, inspect API payloads, and replicate bugs for core engineering teams.",
    skills: ["REST APIs", "SQL Queries", "Log Analysis (Datadog/ELK)", "Postman", "Linux Basics", "Customer Communication"],
    responsibilities: [
      "Analyze webhook delivery failures and webhook retry logic.",
      "Run read-only database queries to verify user data consistency.",
      "Identify recurring bug patterns and write actionable Jira tickets with reproductions.",
      "Maintain high customer satisfaction (CSAT > 95%)."
    ],
    requirements: [
      "Basic understanding of web technologies (HTTP status codes, JSON, APIs).",
      "Comfort using SQL to select and join tables for investigation.",
      "Motivated self-starter who thrives in an autonomous remote culture."
    ],
    benefits: [
      "Friendly international mentorship program.",
      "Flexible schedule with weekend rotation bonuses.",
      "Quarterly wellness and learning stipends."
    ],
    ethiopiaFriendly: true,
    featured: false,
  },
  {
    id: "job-support-03",
    slug: "network-operations-support-engineer",
    title: "Network & Infrastructure Operations Support",
    company: "HyperNet Global",
    category: "system-support",
    categoryLabel: "System Support",
    workMode: "remote",
    workModeLabel: "100% Online / Remote",
    location: "Remote (Flexible)",
    salary: "$2,400 - $3,800 / month",
    experienceLevel: "Mid-Level",
    jobType: "Full-Time",
    deadline: "2026-11-18",
    postedDate: "2026-10-09",
    applyUrl: "https://wellfound.com",
    summary: "Monitor international network backbones, CDN edge servers, and DNS routing. Mitigate packet loss and resolve routing incidents using packet capture tools.",
    skills: ["BGP / OSPF Basics", "Cloudflare DNS", "Wireshark", "Nagios/Zabbix", "Linux CLI", "Incident Response"],
    responsibilities: [
      "Act as first responder during network degradation alerts.",
      "Monitor DDoS defense triggers and traffic redirection policies.",
      "Communicate network status updates to internal stakeholders."
    ],
    requirements: [
      "Knowledge of OSI model, subnetting, DNS hierarchy, and routing protocols.",
      "Experience using network diagnostic tools (traceroute, ping, mtr, dig).",
      "Good team coordination skills."
    ],
    benefits: [
      "Direct USD compensation.",
      "Paid equipment upgrades every 2 years.",
      "Fast-track promotion to Network Architect."
    ],
    ethiopiaFriendly: true,
    featured: false,
  },

  // ================= SYSTEM DEVELOPER =================
  {
    id: "job-dev-01",
    slug: "full-stack-system-developer",
    title: "Full-Stack System Developer (TypeScript, Next.js & Node)",
    company: "Veloce Technologies",
    category: "system-developer",
    categoryLabel: "System Developer",
    workMode: "remote",
    workModeLabel: "100% Online / Remote",
    location: "Global Remote (Ethiopian engineers welcome)",
    salary: "$3,500 - $6,000 / month",
    experienceLevel: "Mid-Level",
    jobType: "Full-Time",
    deadline: "2026-11-28",
    postedDate: "2026-10-12",
    applyUrl: "https://remoteok.com",
    summary: "Develop customer-facing portals and backend microservices using React, Next.js, TypeScript, and Node.js. Build responsive web apps and secure API interfaces.",
    skills: ["TypeScript", "Next.js", "React", "Node.js", "PostgreSQL", "TailwindCSS", "Prisma/Drizzle"],
    responsibilities: [
      "Build modular frontend components with modern animations and clean state management.",
      "Design and maintain RESTful and GraphQL endpoints with robust input validation.",
      "Write unit and end-to-end integration tests to safeguard release reliability.",
      "Optimize bundle size, Web Vitals, and server-side rendering performance."
    ],
    requirements: [
      "3+ years of professional full-stack development experience.",
      "Expert command of modern TypeScript, React (Server Components), and CSS.",
      "Strong foundation in relational databases (PostgreSQL) and schema modeling.",
      "Portfolio of deployed projects or active open-source contributions."
    ],
    benefits: [
      "100% remote work with flexible asynchronous schedule.",
      "Top-tier MacBook Pro / hardware stipend.",
      "Unlimited paid time off (minimum 20 days recommended).",
      "Stock option grants in growing tech company."
    ],
    ethiopiaFriendly: true,
    featured: true,
  },
  {
    id: "job-dev-02",
    slug: "backend-system-developer-python",
    title: "Backend System Developer (Python, FastAPI & Distributed Systems)",
    company: "Synapse Data Systems",
    category: "system-developer",
    categoryLabel: "System Developer",
    workMode: "remote",
    workModeLabel: "100% Online / Remote",
    location: "Remote Worldwide",
    salary: "$4,000 - $6,800 / month",
    experienceLevel: "Senior",
    jobType: "Full-Time",
    deadline: "2026-12-10",
    postedDate: "2026-10-11",
    applyUrl: "https://weworkremotely.com",
    summary: "Architect high-throughput microservices using Python, FastAPI, Redis, and Kafka. Implement asynchronous job queues and real-time data pipelines.",
    skills: ["Python 3.12+", "FastAPI", "AsyncIO", "Redis", "Apache Kafka", "Docker", "SQLAlchemy"],
    responsibilities: [
      "Engineer low-latency microservices handling millions of API calls daily.",
      "Design fault-tolerant event streams with Kafka and background workers with Celery.",
      "Benchmark database queries and implement multi-layer caching with Redis.",
      "Lead architecture reviews and mentor junior engineering colleagues."
    ],
    requirements: [
      "4+ years of backend engineering in Python with async frameworks (FastAPI/Tornado).",
      "Deep understanding of concurrent programming and distributed architectures.",
      "Demonstrated ability to write clean, self-documenting code with comprehensive tests."
    ],
    benefits: [
      "Competitive global compensation paid monthly in USD.",
      "Annual in-person international company retreat (all expenses paid).",
      "Generous book & online course allowance."
    ],
    ethiopiaFriendly: true,
    featured: true,
  },
  {
    id: "job-dev-03",
    slug: "golang-systems-developer",
    title: "High-Performance Systems Developer (Go / C++)",
    company: "KiteScale Infrastructure",
    category: "system-developer",
    categoryLabel: "System Developer",
    workMode: "remote",
    workModeLabel: "100% Online / Remote",
    location: "Global Remote",
    salary: "$4,500 - $7,500 / month",
    experienceLevel: "Senior",
    jobType: "Full-Time",
    deadline: "2026-11-22",
    postedDate: "2026-10-07",
    applyUrl: "https://wellfound.com",
    summary: "Develop network proxies, internal storage engines, and edge computing daemons in Go. Focus on memory safety, zero-copy socket I/O, and CPU efficiency.",
    skills: ["Go (Golang)", "Linux Internals", "gRPC / Protobuf", "Concurrency (Goroutines/Channels)", "Profiling & Pprof", "Distributed Systems"],
    responsibilities: [
      "Write clean, idiomatic Go code for high-throughput network daemons.",
      "Profile memory allocations and optimize CPU hotspots under heavy load.",
      "Integrate OpenTelemetry instrumentation for distributed tracing."
    ],
    requirements: [
      "Strong background in Go or systems-level programming (C/C++/Rust).",
      "Comfortable with Linux syscalls, memory management, and TCP socket tuning.",
      "Self-driven with strong technical documentation skills."
    ],
    benefits: [
      "Flexible hours with zero pointless meetings.",
      "High autonomy and ownership of mission-critical systems.",
      "Competitive salary with annual cost-of-living adjustments."
    ],
    ethiopiaFriendly: true,
    featured: false,
  },
  {
    id: "job-dev-04",
    slug: "mobile-system-developer-flutter",
    title: "Mobile System Developer (Flutter & Dart)",
    company: "BlueNile Digital",
    category: "system-developer",
    categoryLabel: "System Developer",
    workMode: "remote",
    workModeLabel: "100% Online / Remote",
    location: "Remote (Addis Ababa / Worldwide)",
    salary: "$2,800 - $4,500 / month",
    experienceLevel: "Mid-Level",
    jobType: "Full-Time",
    deadline: "2026-12-01",
    postedDate: "2026-10-14",
    applyUrl: "https://remoteok.com",
    summary: "Build offline-first cross-platform applications for iOS and Android. Implement local SQLite databases, push notifications, and cryptographic verification.",
    skills: ["Flutter", "Dart", "Bloc / Riverpod", "SQLite / Drift", "Offline Sync", "REST APIs", "CI/CD Fastlane"],
    responsibilities: [
      "Develop smooth 60fps mobile experiences for pan-African and international users.",
      "Implement robust background synchronization and retry queues for intermittent internet connectivity.",
      "Publish and maintain releases on Google Play Store and Apple App Store."
    ],
    requirements: [
      "2+ years of production Flutter / Dart app development.",
      "Experience with state management solutions (Bloc, Riverpod, or Provider).",
      "Experience handling offline data caching and edge cases."
    ],
    benefits: [
      "Direct USD payments.",
      "Device testing allowance.",
      "Opportunity to shape products used by tens of thousands of users."
    ],
    ethiopiaFriendly: true,
    featured: false,
  }
];

export function getJobsByCategory(category?: string): JobOpening[] {
  if (!category || category === "all") return JOBS_LIST;
  return JOBS_LIST.filter((j) => j.category === category);
}

export function getJobBySlug(slug: string): JobOpening | undefined {
  return JOBS_LIST.find((j) => j.slug === slug || j.id === slug);
}
