/**
 * Language Toggle Component
 * Supports EN (English) and ES-MX (Spanish Mexico) with flag icons
 */

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LanguageToggleProps {
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es-MX', name: 'Español (México)', flag: '🇲🇽' },
]

export function LanguageToggle({ className, variant = 'ghost' }: LanguageToggleProps) {
  const { i18n } = useTranslation()

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={cn('gap-2', className)}
          aria-label="Change language"
        >
          <span className="text-lg">{currentLanguage.flag}</span>
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-medium">
            {currentLanguage.name.split(' ')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              'cursor-pointer',
              i18n.language === lang.code && 'bg-accent'
            )}
          >
            <span className="mr-2 text-lg">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {i18n.language === lang.code && (
              <span className="ml-2 text-xs font-semibold">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageToggle
