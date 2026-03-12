/**
 * Skills Search Component with Predictive Autocomplete
 *
 * Features:
 * - Real-time autocomplete suggestions as user types
 * - Category filtering with chips
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Fuzzy matching for typo tolerance
 * - Mobile-responsive design
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, Loader2, ChevronRight, Star, Download, Check, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { BASE_API_URL } from '@/constants'

// Types
interface SearchSuggestion {
  text: string
  type: 'skill' | 'category' | 'tag' | 'owner'
  skill_id?: string
  category_id?: string
  match_score: number
}

interface SkillSummary {
  id: string
  name: string
  slug: string
  owner: string
  repo: string
  description?: string
  category_id?: string
  category_name?: string
  install_command: string
  install_count: number
  is_official: boolean
  is_verified: boolean
  is_featured: boolean
  rating: number
  tags: string[]
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  skill_count: number
}

interface SearchResponse {
  query: string
  total: number
  page: number
  page_size: number
  total_pages: number
  skills: SkillSummary[]
  facets: {
    categories: { id: string; name: string; count: number }[]
    tags: { name: string; count: number }[]
  }
}

// Category colors mapping
const categoryColors: Record<string, string> = {
  dev: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  design: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  docs: 'bg-green-500/10 text-green-500 border-green-500/20',
  security: 'bg-red-500/10 text-red-500 border-red-500/20',
  devops: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  data: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  ai: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  marketing: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  mobile: 'bg-lime-500/10 text-lime-500 border-lime-500/20',
  testing: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  comm: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  productivity: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
}

export default function SkillsSearch() {
  const { t } = useTranslation()

  // State
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [results, setResults] = useState<SkillSummary[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [totalResults, setTotalResults] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/skills/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  // Autocomplete as user types
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setSuggestions([])
      return
    }

    setIsSuggestionsLoading(true)
    try {
      const response = await fetch(
        `${BASE_API_URL}/api/skills/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=8`
      )
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
    } finally {
      setIsSuggestionsLoading(false)
    }
  }, [])

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, 150) // Fast 150ms debounce for responsive feel

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, fetchSuggestions])

  // Full search
  const performSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    setIsLoading(true)
    setShowSuggestions(false)

    try {
      const params = new URLSearchParams({
        q,
        page_size: '20',
      })
      if (selectedCategory) {
        params.append('categories', selectedCategory)
      }

      const response = await fetch(`${BASE_API_URL}/api/skills/search?${params}`)
      if (response.ok) {
        const data: SearchResponse = await response.json()
        setResults(data.skills)
        setTotalResults(data.total)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        performSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          const suggestion = suggestions[selectedIndex]
          setQuery(suggestion.text)
          setShowSuggestions(false)
          performSearch(suggestion.text)
        } else {
          performSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Copy install command
  const copyInstallCommand = async (skill: SkillSummary) => {
    try {
      await navigator.clipboard.writeText(skill.install_command)
      setCopiedId(skill.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Skills Catalog
        </h1>
        <p className="text-muted-foreground">
          Discover and install agent skills to enhance your AI workflows
        </p>
      </div>

      {/* Search Input with Autocomplete */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search skills... (e.g., react, pdf, security)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setShowSuggestions(true)}
            className="pl-10 pr-10 h-12 text-lg bg-slate-900/80 border-slate-700/50 focus:border-indigo-500"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setSuggestions([])
                setResults([])
                inputRef.current?.focus()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {isSuggestionsLoading && (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.text}-${index}`}
                onClick={() => {
                  setQuery(suggestion.text)
                  setShowSuggestions(false)
                  performSearch(suggestion.text)
                }}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-800 transition-colors",
                  index === selectedIndex && "bg-slate-800"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{suggestion.text}</span>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setSelectedCategory(null)
            if (query) performSearch()
          }}
          className="rounded-full"
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedCategory(category.id)
              if (query) performSearch()
            }}
            className={cn(
              "rounded-full",
              selectedCategory !== category.id && categoryColors[category.id]
            )}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Results Count */}
      {results.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Found {totalResults} skills matching "{query}"
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      )}

      {/* Results Grid */}
      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((skill) => (
            <Card
              key={skill.id}
              className="bg-slate-900/80 border-slate-700/50 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="truncate">{skill.name}</span>
                      {skill.is_official && (
                        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-xs">
                          Official
                        </Badge>
                      )}
                      {skill.is_verified && !skill.is_official && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Verified
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {skill.owner}/{skill.repo}
                    </CardDescription>
                  </div>
                  {skill.is_featured && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {skill.description || 'No description available'}
                </p>

                {/* Tags */}
                {skill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {skill.tags.slice(0, 4).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-slate-800 hover:bg-slate-700"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {skill.tags.length > 4 && (
                      <Badge variant="secondary" className="text-xs bg-slate-800">
                        +{skill.tags.length - 4}
                      </Badge>
                    )}
                  </div>
                )}

                <Separator className="bg-slate-700/50" />

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Download className="h-3 w-3" />
                    <span>{skill.install_count.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => window.open(`https://github.com/${skill.owner}/${skill.repo}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => copyInstallCommand(skill)}
                    >
                      {copiedId === skill.id ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        'Copy Install'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && query && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No skills found matching "{query}"
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Try a different search term or browse categories
          </p>
        </div>
      )}

      {/* Initial State - Featured Skills */}
      {!query && results.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Start typing to search for skills, or browse by category
          </p>
          <div className="text-xs text-muted-foreground">
            <p>Install skills with: <code className="bg-slate-800 px-2 py-1 rounded">npx skills add owner/repo</code></p>
          </div>
        </div>
      )}
    </div>
  )
}
