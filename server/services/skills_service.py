"""
Skills Service - Search, Autocomplete, and Catalog Management

Provides fast, predictive search with categorization and installation tracking.
"""

import uuid
import json
import logging
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from difflib import SequenceMatcher

from server.models.skills_models import (
    SkillCategory,
    CategoryCreate,
    CategoryResponse,
    SkillCreate,
    SkillSummary,
    SkillDetail,
    SearchRequest,
    SearchResponse,
    SearchSuggestion,
    AutocompleteRequest,
    AutocompleteResponse,
    SkillInstallRequest,
    SkillInstallResponse,
    InstalledSkill,
    UserSkillsResponse,
    SkillRatingRequest,
    SkillRatingResponse,
    BulkImportRequest,
    BulkImportResponse,
    SkillImportItem,
    SkillStats,
)

logger = logging.getLogger(__name__)


class SkillsService:
    """
    Main service for skills catalog management.

    Features:
    - Fast autocomplete with predictive suggestions
    - Category-based browsing
    - Full-text search with relevance ranking
    - Installation tracking
    - Rating system
    """

    def __init__(self, db_service=None):
        self.db = db_service
        self._categories_cache: Dict[str, CategoryResponse] = {}
        self._search_index: Dict[str, List[Tuple[str, str, float]]] = {}  # term -> [(skill_id, type, weight)]
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize service and build search index."""
        if self._initialized:
            return

        # Seed default categories
        await self._seed_categories()

        # Seed skills from known sources
        await self._seed_skills()

        # Build search index
        await self._build_search_index()

        self._initialized = True
        logger.info("Skills service initialized")

    # ==================== Category Management ====================

    async def _seed_categories(self) -> None:
        """Seed default skill categories."""
        categories = [
            {"id": "dev", "name": "Development", "slug": "development", "icon": "code", "color": "#3B82F6", "description": "Programming frameworks, languages, and development patterns"},
            {"id": "design", "name": "Design", "slug": "design", "icon": "palette", "color": "#EC4899", "description": "UI/UX, visual design, and creative tools"},
            {"id": "docs", "name": "Documentation", "slug": "documentation", "icon": "file-text", "color": "#10B981", "description": "Document creation, editing, and management"},
            {"id": "security", "name": "Security", "slug": "security", "icon": "shield", "color": "#EF4444", "description": "Security auditing, vulnerability scanning, and compliance"},
            {"id": "devops", "name": "DevOps", "slug": "devops", "icon": "server", "color": "#F59E0B", "description": "CI/CD, infrastructure, and deployment"},
            {"id": "data", "name": "Data & Analytics", "slug": "data", "icon": "database", "color": "#8B5CF6", "description": "Data processing, visualization, and analytics"},
            {"id": "ai", "name": "AI & ML", "slug": "ai-ml", "icon": "brain", "color": "#06B6D4", "description": "Machine learning, LLMs, and AI tools"},
            {"id": "marketing", "name": "Marketing", "slug": "marketing", "icon": "megaphone", "color": "#F97316", "description": "SEO, content, and marketing automation"},
            {"id": "mobile", "name": "Mobile", "slug": "mobile", "icon": "smartphone", "color": "#84CC16", "description": "iOS, Android, and cross-platform mobile development"},
            {"id": "testing", "name": "Testing", "slug": "testing", "icon": "check-circle", "color": "#14B8A6", "description": "Test automation, QA, and validation"},
            {"id": "comm", "name": "Communication", "slug": "communication", "icon": "message-circle", "color": "#6366F1", "description": "Writing, messaging, and collaboration"},
            {"id": "productivity", "name": "Productivity", "slug": "productivity", "icon": "zap", "color": "#FBBF24", "description": "Workflow automation and productivity tools"},
        ]

        for cat in categories:
            self._categories_cache[cat["id"]] = CategoryResponse(
                id=cat["id"],
                name=cat["name"],
                slug=cat["slug"],
                description=cat["description"],
                icon=cat["icon"],
                color=cat["color"],
                sort_order=0,
                skill_count=0,
                created_at=datetime.utcnow()
            )

    async def get_categories(self) -> List[CategoryResponse]:
        """Get all categories."""
        return list(self._categories_cache.values())

    async def get_category(self, category_id: str) -> Optional[CategoryResponse]:
        """Get a single category."""
        return self._categories_cache.get(category_id)

    # ==================== Skills Seeding ====================

    async def _seed_skills(self) -> None:
        """Seed skills from known repositories."""
        skills_data = self._get_skills_seed_data()

        for skill_data in skills_data:
            skill_id = str(uuid.uuid4())[:8]
            slug = self._slugify(f"{skill_data['owner']}-{skill_data['name']}")

            skill = SkillSummary(
                id=skill_id,
                name=skill_data["name"],
                slug=slug,
                owner=skill_data["owner"],
                repo=skill_data["repo"],
                description=skill_data.get("description"),
                category_id=skill_data.get("category_id"),
                category_name=self._categories_cache.get(skill_data.get("category_id", ""), CategoryResponse(id="", name="", slug="", created_at=datetime.utcnow())).name if skill_data.get("category_id") else None,
                install_command=f"npx skills add {skill_data['owner']}/{skill_data['repo']}",
                install_count=skill_data.get("install_count", 0),
                is_official=skill_data.get("is_official", False),
                is_verified=skill_data.get("is_verified", False),
                is_featured=skill_data.get("is_featured", False),
                rating=skill_data.get("rating", 0.0),
                tags=skill_data.get("tags", [])
            )

            # Store in memory (would use DB in production)
            if not hasattr(self, '_skills_cache'):
                self._skills_cache: Dict[str, SkillSummary] = {}
            self._skills_cache[skill_id] = skill

    def _get_skills_seed_data(self) -> List[Dict[str, Any]]:
        """Get comprehensive skills seed data from skills.sh and known repos."""
        return [
            # ==================== Official Anthropic Skills ====================
            {"name": "docx", "owner": "anthropics", "repo": "skills", "description": "Create, edit, and analyze Word documents with tracked changes, comments, and formatting", "category_id": "docs", "is_official": True, "is_verified": True, "is_featured": True, "install_count": 15000, "tags": ["word", "documents", "office", "editing"]},
            {"name": "pdf", "owner": "anthropics", "repo": "skills", "description": "PDF manipulation toolkit for extracting text, creating, merging, and splitting documents", "category_id": "docs", "is_official": True, "is_verified": True, "is_featured": True, "install_count": 14500, "tags": ["pdf", "documents", "extraction", "merge"]},
            {"name": "pptx", "owner": "anthropics", "repo": "skills", "description": "Create and edit PowerPoint presentations with layouts, templates, and charts", "category_id": "docs", "is_official": True, "is_verified": True, "is_featured": True, "install_count": 12000, "tags": ["powerpoint", "presentations", "slides", "office"]},
            {"name": "xlsx", "owner": "anthropics", "repo": "skills", "description": "Create and analyze Excel spreadsheets with formulas, formatting, and visualization", "category_id": "docs", "is_official": True, "is_verified": True, "is_featured": True, "install_count": 13500, "tags": ["excel", "spreadsheets", "data", "office"]},
            {"name": "frontend-design", "owner": "anthropics", "repo": "skills", "description": "Avoid generic aesthetics and build beautiful, unique frontend interfaces", "category_id": "design", "is_official": True, "is_verified": True, "is_featured": True, "install_count": 1700, "tags": ["frontend", "ui", "react", "tailwind"]},
            {"name": "artifacts-builder", "owner": "anthropics", "repo": "skills", "description": "Build complex HTML artifacts using React, Tailwind CSS, and shadcn/ui", "category_id": "dev", "is_official": True, "is_verified": True, "install_count": 8500, "tags": ["react", "artifacts", "html", "tailwind"]},
            {"name": "mcp-builder", "owner": "anthropics", "repo": "skills", "description": "Create high-quality MCP servers to integrate external APIs and services", "category_id": "ai", "is_official": True, "is_verified": True, "is_featured": True, "install_count": 9200, "tags": ["mcp", "api", "integration", "servers"]},
            {"name": "webapp-testing", "owner": "anthropics", "repo": "skills", "description": "Test local web applications using Playwright for UI verification", "category_id": "testing", "is_official": True, "is_verified": True, "install_count": 6800, "tags": ["playwright", "testing", "e2e", "web"]},
            {"name": "brand-guidelines", "owner": "anthropics", "repo": "skills", "description": "Apply brand colors and typography to artifacts consistently", "category_id": "design", "is_official": True, "is_verified": True, "install_count": 4500, "tags": ["branding", "design", "typography", "colors"]},
            {"name": "internal-comms", "owner": "anthropics", "repo": "skills", "description": "Write internal communications like status reports, newsletters, and FAQs", "category_id": "comm", "is_official": True, "is_verified": True, "install_count": 3800, "tags": ["writing", "communications", "reports", "newsletters"]},
            {"name": "skill-creator", "owner": "anthropics", "repo": "skills", "description": "Interactive tool that guides you through building new skills", "category_id": "ai", "is_official": True, "is_verified": True, "is_featured": True, "install_count": 1300, "tags": ["skills", "creation", "development", "meta"]},
            {"name": "algorithmic-art", "owner": "anthropics", "repo": "skills", "description": "Create generative art using p5.js with seeded randomness and flow fields", "category_id": "design", "is_official": True, "is_verified": True, "install_count": 2200, "tags": ["art", "generative", "p5js", "creative"]},
            {"name": "canvas-design", "owner": "anthropics", "repo": "skills", "description": "Design visual art in PNG and PDF formats using design philosophies", "category_id": "design", "is_official": True, "is_verified": True, "install_count": 1800, "tags": ["canvas", "design", "png", "visual"]},
            {"name": "slack-gif-creator", "owner": "anthropics", "repo": "skills", "description": "Create animated GIFs optimized for Slack size constraints", "category_id": "design", "is_official": True, "install_count": 950, "tags": ["gif", "slack", "animation", "images"]},

            # ==================== Vercel Labs Skills ====================
            {"name": "react-best-practices", "owner": "vercel-labs", "repo": "agent-skills", "description": "React and Next.js performance optimization with 40+ rules across 8 categories", "category_id": "dev", "is_verified": True, "is_featured": True, "install_count": 27200, "tags": ["react", "nextjs", "performance", "optimization", "frontend"]},
            {"name": "web-design-guidelines", "owner": "vercel-labs", "repo": "agent-skills", "description": "Audit UI code against 100+ accessibility and UX best practice rules", "category_id": "design", "is_verified": True, "is_featured": True, "install_count": 20700, "tags": ["accessibility", "a11y", "ux", "design", "audit"]},
            {"name": "vercel-deploy-claimable", "owner": "vercel-labs", "repo": "agent-skills", "description": "Instant deployment to Vercel with auto-detection for 40+ frameworks", "category_id": "devops", "is_verified": True, "install_count": 8500, "tags": ["vercel", "deploy", "hosting", "preview"]},

            # ==================== Expo Mobile Skills ====================
            {"name": "building-native-ui", "owner": "expo", "repo": "skills", "description": "Build beautiful native mobile UI with React Native and Expo", "category_id": "mobile", "is_verified": True, "is_featured": True, "install_count": 1600, "tags": ["react-native", "expo", "mobile", "ui", "ios", "android"]},
            {"name": "upgrading-expo", "owner": "expo", "repo": "skills", "description": "Guide for upgrading Expo SDK versions safely", "category_id": "mobile", "is_verified": True, "install_count": 1500, "tags": ["expo", "upgrade", "sdk", "migration"]},
            {"name": "native-data-fetching", "owner": "expo", "repo": "skills", "description": "Efficient data fetching patterns for React Native apps", "category_id": "mobile", "is_verified": True, "install_count": 1400, "tags": ["react-native", "data", "fetching", "api"]},
            {"name": "expo-dev-client", "owner": "expo", "repo": "skills", "description": "Build and configure Expo development client", "category_id": "mobile", "is_verified": True, "install_count": 1300, "tags": ["expo", "dev-client", "development", "native"]},
            {"name": "expo-deployment", "owner": "expo", "repo": "skills", "description": "Deploy Expo apps to App Store and Play Store", "category_id": "mobile", "is_verified": True, "install_count": 1300, "tags": ["expo", "deployment", "app-store", "play-store"]},

            # ==================== Remotion Video Skills ====================
            {"name": "remotion-best-practices", "owner": "remotion-dev", "repo": "skills", "description": "Create programmatic videos with React using Remotion best practices", "category_id": "design", "is_verified": True, "is_featured": True, "install_count": 5500, "tags": ["remotion", "video", "react", "animation", "programmatic"]},

            # ==================== Security Skills ====================
            {"name": "security-audit", "owner": "trailofbits", "repo": "skills", "description": "Security code auditing with CodeQL and Semgrep static analysis", "category_id": "security", "is_verified": True, "is_featured": True, "install_count": 4200, "tags": ["security", "audit", "codeql", "semgrep", "sast"]},
            {"name": "vulnerability-detection", "owner": "trailofbits", "repo": "skills", "description": "Detect common vulnerabilities and security anti-patterns", "category_id": "security", "is_verified": True, "install_count": 3800, "tags": ["security", "vulnerabilities", "detection", "owasp"]},
            {"name": "ffuf-web-fuzzing", "owner": "jthack", "repo": "ffuf_claude_skill", "description": "Expert guidance for ffuf web fuzzing during penetration testing", "category_id": "security", "install_count": 1200, "tags": ["fuzzing", "pentesting", "ffuf", "web-security"]},

            # ==================== Data & Analytics Skills ====================
            {"name": "d3js-visualization", "owner": "chrisvoncsefalvay", "repo": "claude-d3js-skill", "description": "Create stunning data visualizations with D3.js", "category_id": "data", "install_count": 2100, "tags": ["d3js", "visualization", "charts", "data"]},
            {"name": "scientific-computing", "owner": "K-Dense-AI", "repo": "claude-scientific-skills", "description": "Scientific skills for specialized libraries and databases", "category_id": "data", "install_count": 1800, "tags": ["science", "computing", "research", "data"]},

            # ==================== DevOps & Infrastructure Skills ====================
            {"name": "terraform-patterns", "owner": "hashicorp", "repo": "agent-skills", "description": "Infrastructure as Code best practices with Terraform", "category_id": "devops", "is_verified": True, "install_count": 3500, "tags": ["terraform", "iac", "infrastructure", "cloud"]},
            {"name": "kubernetes-guide", "owner": "kubernetes", "repo": "agent-skills", "description": "Kubernetes deployment and management patterns", "category_id": "devops", "is_verified": True, "install_count": 3200, "tags": ["kubernetes", "k8s", "containers", "orchestration"]},
            {"name": "docker-best-practices", "owner": "docker", "repo": "agent-skills", "description": "Docker containerization patterns and optimization", "category_id": "devops", "install_count": 2800, "tags": ["docker", "containers", "images", "dockerfile"]},
            {"name": "github-actions", "owner": "actions", "repo": "agent-skills", "description": "CI/CD automation with GitHub Actions workflows", "category_id": "devops", "is_verified": True, "install_count": 4100, "tags": ["github", "ci-cd", "actions", "automation"]},

            # ==================== Testing Skills ====================
            {"name": "playwright-automation", "owner": "lackeyjb", "repo": "playwright-skill", "description": "General-purpose browser automation using Playwright", "category_id": "testing", "install_count": 2400, "tags": ["playwright", "automation", "browser", "e2e"]},
            {"name": "ios-simulator", "owner": "conorluddy", "repo": "ios-simulator-skill", "description": "iOS app building, navigation, and testing via automation", "category_id": "testing", "install_count": 1100, "tags": ["ios", "simulator", "testing", "mobile"]},
            {"name": "jest-testing", "owner": "facebook", "repo": "agent-skills", "description": "Unit and integration testing with Jest", "category_id": "testing", "install_count": 3600, "tags": ["jest", "testing", "unit", "javascript"]},
            {"name": "cypress-e2e", "owner": "cypress-io", "repo": "agent-skills", "description": "End-to-end testing with Cypress", "category_id": "testing", "install_count": 2900, "tags": ["cypress", "e2e", "testing", "browser"]},

            # ==================== Marketing Skills ====================
            {"name": "seo-audit", "owner": "coreyhaines31", "repo": "marketingskills", "description": "SEO auditing and optimization recommendations", "category_id": "marketing", "install_count": 2200, "tags": ["seo", "audit", "optimization", "search"]},
            {"name": "copywriting", "owner": "coreyhaines31", "repo": "marketingskills", "description": "Marketing copywriting and content creation", "category_id": "marketing", "install_count": 1900, "tags": ["copywriting", "content", "marketing", "writing"]},
            {"name": "content-strategy", "owner": "jimliu", "repo": "baoyu-skills", "description": "Content strategy and content generation", "category_id": "marketing", "install_count": 2500, "tags": ["content", "strategy", "marketing", "generation"]},

            # ==================== AI & ML Skills ====================
            {"name": "rag-implementation", "owner": "langchain-ai", "repo": "agent-skills", "description": "Retrieval-Augmented Generation implementation patterns", "category_id": "ai", "is_verified": True, "install_count": 4800, "tags": ["rag", "retrieval", "llm", "embeddings"]},
            {"name": "prompt-engineering", "owner": "anthropics", "repo": "skills", "description": "Advanced prompt engineering techniques", "category_id": "ai", "is_official": True, "install_count": 5200, "tags": ["prompts", "engineering", "llm", "optimization"]},
            {"name": "llm-evaluation", "owner": "openai", "repo": "agent-skills", "description": "Evaluate and benchmark LLM outputs", "category_id": "ai", "install_count": 2100, "tags": ["llm", "evaluation", "benchmarks", "testing"]},
            {"name": "agent-orchestration", "owner": "langchain-ai", "repo": "agent-skills", "description": "Multi-agent orchestration patterns", "category_id": "ai", "is_verified": True, "install_count": 3400, "tags": ["agents", "orchestration", "multi-agent", "workflows"]},
            {"name": "loki-mode", "owner": "asklokesh", "repo": "claudeskill-loki-mode", "description": "Multi-agent autonomous startup system - 37 AI agents across 6 swarms", "category_id": "ai", "is_featured": True, "install_count": 1800, "tags": ["agents", "swarm", "autonomous", "startup"]},

            # ==================== Productivity Skills ====================
            {"name": "superpowers", "owner": "obra", "repo": "superpowers", "description": "Core skills library with 20+ battle-tested skills including TDD and debugging", "category_id": "productivity", "is_featured": True, "install_count": 6500, "tags": ["tdd", "debugging", "collaboration", "productivity"]},
            {"name": "superpowers-lab", "owner": "obra", "repo": "superpowers-lab", "description": "Experimental skills using refined techniques", "category_id": "productivity", "install_count": 2800, "tags": ["experimental", "productivity", "advanced"]},
            {"name": "web-asset-generator", "owner": "alonw0", "repo": "web-asset-generator", "description": "Generate favicons, app icons, and social media images", "category_id": "productivity", "install_count": 1400, "tags": ["assets", "icons", "favicons", "images"]},
            {"name": "skill-seekers", "owner": "yusufkaraaslan", "repo": "Skill_Seekers", "description": "Convert documentation websites into Claude Skills", "category_id": "productivity", "install_count": 850, "tags": ["documentation", "conversion", "skills", "automation"]},

            # ==================== Framework-Specific Skills ====================
            {"name": "vue-patterns", "owner": "vuejs", "repo": "agent-skills", "description": "Vue.js 3 composition API patterns and best practices", "category_id": "dev", "is_verified": True, "install_count": 3100, "tags": ["vue", "vuejs", "composition-api", "frontend"]},
            {"name": "svelte-guide", "owner": "sveltejs", "repo": "agent-skills", "description": "Svelte and SvelteKit development patterns", "category_id": "dev", "is_verified": True, "install_count": 2400, "tags": ["svelte", "sveltekit", "frontend", "framework"]},
            {"name": "angular-patterns", "owner": "angular", "repo": "agent-skills", "description": "Angular development patterns and optimization", "category_id": "dev", "is_verified": True, "install_count": 2600, "tags": ["angular", "typescript", "frontend", "framework"]},
            {"name": "nestjs-patterns", "owner": "nestjs", "repo": "agent-skills", "description": "NestJS backend patterns and architecture", "category_id": "dev", "is_verified": True, "install_count": 2200, "tags": ["nestjs", "backend", "nodejs", "typescript"]},
            {"name": "fastapi-guide", "owner": "tiangolo", "repo": "agent-skills", "description": "FastAPI development patterns and best practices", "category_id": "dev", "is_verified": True, "install_count": 2800, "tags": ["fastapi", "python", "api", "backend"]},
            {"name": "django-patterns", "owner": "django", "repo": "agent-skills", "description": "Django web development patterns", "category_id": "dev", "is_verified": True, "install_count": 2400, "tags": ["django", "python", "web", "backend"]},
            {"name": "rails-guide", "owner": "rails", "repo": "agent-skills", "description": "Ruby on Rails development patterns", "category_id": "dev", "is_verified": True, "install_count": 1800, "tags": ["rails", "ruby", "web", "backend"]},
            {"name": "go-patterns", "owner": "golang", "repo": "agent-skills", "description": "Go programming patterns and best practices", "category_id": "dev", "is_verified": True, "install_count": 2100, "tags": ["go", "golang", "backend", "systems"]},
            {"name": "rust-guide", "owner": "rust-lang", "repo": "agent-skills", "description": "Rust programming patterns and memory safety", "category_id": "dev", "is_verified": True, "install_count": 1900, "tags": ["rust", "systems", "memory-safety", "performance"]},

            # ==================== Database Skills ====================
            {"name": "postgresql-guide", "owner": "postgres", "repo": "agent-skills", "description": "PostgreSQL database design and optimization", "category_id": "data", "is_verified": True, "install_count": 2600, "tags": ["postgresql", "database", "sql", "optimization"]},
            {"name": "mongodb-patterns", "owner": "mongodb", "repo": "agent-skills", "description": "MongoDB document design and querying patterns", "category_id": "data", "is_verified": True, "install_count": 2200, "tags": ["mongodb", "nosql", "database", "documents"]},
            {"name": "redis-guide", "owner": "redis", "repo": "agent-skills", "description": "Redis caching and data structure patterns", "category_id": "data", "is_verified": True, "install_count": 1800, "tags": ["redis", "caching", "data-structures", "performance"]},

            # ==================== Communication Skills ====================
            {"name": "technical-writing", "owner": "google", "repo": "agent-skills", "description": "Technical documentation and writing best practices", "category_id": "comm", "is_verified": True, "install_count": 3200, "tags": ["writing", "documentation", "technical", "communication"]},
            {"name": "api-documentation", "owner": "swagger", "repo": "agent-skills", "description": "API documentation with OpenAPI/Swagger", "category_id": "comm", "is_verified": True, "install_count": 2400, "tags": ["api", "documentation", "openapi", "swagger"]},
            {"name": "readme-generator", "owner": "github", "repo": "agent-skills", "description": "Generate comprehensive README files", "category_id": "comm", "install_count": 2800, "tags": ["readme", "documentation", "github", "markdown"]},
        ]

    # ==================== Search Index ====================

    async def _build_search_index(self) -> None:
        """Build in-memory search index for fast autocomplete."""
        self._search_index.clear()

        for skill_id, skill in self._skills_cache.items():
            # Index skill name (highest weight)
            self._add_to_index(skill.name.lower(), skill_id, "skill", 1.0)

            # Index individual words in name
            for word in skill.name.lower().split("-"):
                self._add_to_index(word, skill_id, "skill", 0.8)

            # Index owner
            self._add_to_index(skill.owner.lower(), skill_id, "owner", 0.6)

            # Index description words
            if skill.description:
                for word in self._tokenize(skill.description):
                    if len(word) > 2:
                        self._add_to_index(word, skill_id, "description", 0.4)

            # Index tags
            for tag in skill.tags:
                self._add_to_index(tag.lower(), skill_id, "tag", 0.7)

        logger.info(f"Search index built with {len(self._search_index)} terms")

    def _add_to_index(self, term: str, skill_id: str, term_type: str, weight: float) -> None:
        """Add a term to the search index."""
        if term not in self._search_index:
            self._search_index[term] = []
        self._search_index[term].append((skill_id, term_type, weight))

    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text for indexing."""
        return re.findall(r'\b[a-z]+\b', text.lower())

    def _slugify(self, text: str) -> str:
        """Convert text to URL-friendly slug."""
        return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

    # ==================== Autocomplete ====================

    async def autocomplete(self, request: AutocompleteRequest) -> AutocompleteResponse:
        """
        Get autocomplete suggestions for a search query.

        Uses prefix matching and fuzzy matching for typo tolerance.
        """
        query = request.query.lower().strip()
        suggestions: List[SearchSuggestion] = []
        seen_skills: set = set()

        # Exact prefix matches (highest priority)
        for term, entries in self._search_index.items():
            if term.startswith(query):
                for skill_id, term_type, weight in entries:
                    if skill_id not in seen_skills:
                        skill = self._skills_cache.get(skill_id)
                        if skill:
                            # Calculate match score based on how close the match is
                            match_ratio = len(query) / len(term) if len(term) > 0 else 0
                            score = weight * (0.5 + 0.5 * match_ratio)

                            suggestions.append(SearchSuggestion(
                                text=skill.name,
                                type="skill",
                                skill_id=skill_id,
                                match_score=score
                            ))
                            seen_skills.add(skill_id)

        # Fuzzy matches for typo tolerance
        if len(suggestions) < request.limit:
            for term, entries in self._search_index.items():
                similarity = SequenceMatcher(None, query, term).ratio()
                if similarity > 0.6 and not term.startswith(query):
                    for skill_id, term_type, weight in entries:
                        if skill_id not in seen_skills:
                            skill = self._skills_cache.get(skill_id)
                            if skill:
                                suggestions.append(SearchSuggestion(
                                    text=skill.name,
                                    type="skill",
                                    skill_id=skill_id,
                                    match_score=similarity * weight * 0.5
                                ))
                                seen_skills.add(skill_id)

        # Add category suggestions
        if request.include_categories:
            for cat_id, cat in self._categories_cache.items():
                if query in cat.name.lower() or query in cat.slug:
                    suggestions.append(SearchSuggestion(
                        text=cat.name,
                        type="category",
                        category_id=cat_id,
                        match_score=0.9 if cat.name.lower().startswith(query) else 0.6
                    ))

        # Sort by match score and limit
        suggestions.sort(key=lambda x: x.match_score, reverse=True)
        suggestions = suggestions[:request.limit]

        return AutocompleteResponse(
            query=request.query,
            suggestions=suggestions
        )

    # ==================== Search ====================

    async def search(self, request: SearchRequest) -> SearchResponse:
        """
        Full-text search with filtering and facets.
        """
        query = request.query.lower().strip()
        matching_skill_ids: Dict[str, float] = {}

        # Find matching skills
        for term, entries in self._search_index.items():
            if query in term or term in query:
                for skill_id, term_type, weight in entries:
                    if skill_id not in matching_skill_ids:
                        matching_skill_ids[skill_id] = 0
                    matching_skill_ids[skill_id] += weight

        # Apply filters
        filtered_skills: List[SkillSummary] = []
        for skill_id, score in matching_skill_ids.items():
            skill = self._skills_cache.get(skill_id)
            if not skill:
                continue

            # Category filter
            if request.categories and skill.category_id not in request.categories:
                continue

            # Tag filter
            if request.tags:
                if not any(tag in skill.tags for tag in request.tags):
                    continue

            # Official filter
            if request.official_only and not skill.is_official:
                continue

            # Verified filter
            if request.verified_only and not skill.is_verified:
                continue

            # Featured filter
            if request.featured_only and not skill.is_featured:
                continue

            filtered_skills.append(skill)

        # Sort
        if request.sort_by == "installs":
            filtered_skills.sort(key=lambda x: x.install_count, reverse=True)
        elif request.sort_by == "rating":
            filtered_skills.sort(key=lambda x: x.rating, reverse=True)
        elif request.sort_by == "name":
            filtered_skills.sort(key=lambda x: x.name.lower())
        else:  # relevance
            filtered_skills.sort(key=lambda x: matching_skill_ids.get(x.id, 0), reverse=True)

        # Pagination
        total = len(filtered_skills)
        start = (request.page - 1) * request.page_size
        end = start + request.page_size
        paginated_skills = filtered_skills[start:end]

        # Build facets
        facets = self._build_facets(filtered_skills)

        return SearchResponse(
            query=request.query,
            total=total,
            page=request.page,
            page_size=request.page_size,
            total_pages=(total + request.page_size - 1) // request.page_size,
            skills=paginated_skills,
            facets=facets
        )

    def _build_facets(self, skills: List[SkillSummary]) -> Dict[str, List[Dict[str, Any]]]:
        """Build facets for search results."""
        category_counts: Dict[str, int] = {}
        tag_counts: Dict[str, int] = {}

        for skill in skills:
            if skill.category_id:
                category_counts[skill.category_id] = category_counts.get(skill.category_id, 0) + 1
            for tag in skill.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

        return {
            "categories": [
                {"id": cat_id, "name": self._categories_cache.get(cat_id, CategoryResponse(id="", name=cat_id, slug="", created_at=datetime.utcnow())).name, "count": count}
                for cat_id, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            ],
            "tags": [
                {"name": tag, "count": count}
                for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:20]
            ]
        }

    # ==================== Skill Operations ====================

    async def get_skill(self, skill_id: str) -> Optional[SkillDetail]:
        """Get skill details by ID."""
        skill = self._skills_cache.get(skill_id)
        if not skill:
            return None

        return SkillDetail(
            id=skill.id,
            name=skill.name,
            slug=skill.slug,
            owner=skill.owner,
            repo=skill.repo,
            description=skill.description,
            long_description=None,
            category_id=skill.category_id,
            category_name=skill.category_name,
            subcategory=None,
            install_command=skill.install_command,
            install_count=skill.install_count,
            is_official=skill.is_official,
            is_verified=skill.is_verified,
            is_featured=skill.is_featured,
            rating=skill.rating,
            rating_count=0,
            tags=skill.tags,
            supported_agents=[],
            dependencies=[],
            version=None,
            documentation_url=f"https://github.com/{skill.owner}/{skill.repo}",
            source_url=f"https://github.com/{skill.owner}/{skill.repo}",
            icon_url=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

    async def get_skills_by_category(self, category_id: str, page: int = 1, page_size: int = 20) -> List[SkillSummary]:
        """Get skills in a category."""
        skills = [s for s in self._skills_cache.values() if s.category_id == category_id]
        skills.sort(key=lambda x: x.install_count, reverse=True)

        start = (page - 1) * page_size
        end = start + page_size
        return skills[start:end]

    async def get_featured_skills(self, limit: int = 10) -> List[SkillSummary]:
        """Get featured skills."""
        featured = [s for s in self._skills_cache.values() if s.is_featured]
        featured.sort(key=lambda x: x.install_count, reverse=True)
        return featured[:limit]

    async def get_trending_skills(self, limit: int = 10) -> List[SkillSummary]:
        """Get trending skills (by install count for now)."""
        skills = list(self._skills_cache.values())
        skills.sort(key=lambda x: x.install_count, reverse=True)
        return skills[:limit]

    async def get_stats(self) -> SkillStats:
        """Get global statistics."""
        skills = list(self._skills_cache.values())

        return SkillStats(
            total_skills=len(skills),
            total_categories=len(self._categories_cache),
            total_installs=sum(s.install_count for s in skills),
            official_skills=sum(1 for s in skills if s.is_official),
            verified_skills=sum(1 for s in skills if s.is_verified),
            featured_skills=sum(1 for s in skills if s.is_featured),
            top_categories=[
                {"id": cat_id, "name": cat.name, "count": sum(1 for s in skills if s.category_id == cat_id)}
                for cat_id, cat in self._categories_cache.items()
            ][:5],
            trending_skills=await self.get_trending_skills(5),
            recent_skills=skills[:5]
        )


# Global instance
skills_service = SkillsService()
