import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const USER_ONLY_PATHS = ['/cart', '/checkout', '/orders', '/profile']
const AUTH_PATHS = ['/login', '/register']

function matches(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`)
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser() memverifikasi token ke server Supabase (bukan hanya membaca cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ''
    Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => response.cookies.set(c))
    return response
  }

  const isAdminPath = matches(pathname, '/admin')
  const needsLogin = isAdminPath || USER_ONLY_PATHS.some((p) => matches(pathname, p))

  if (!user && needsLogin) {
    return redirectTo('/login', { next: `${pathname}${search}` })
  }

  if (user && AUTH_PATHS.includes(pathname)) {
    return redirectTo('/')
  }

  if (user && isAdminPath) {
    // Role dibaca dari database (dilindungi RLS), bukan dari token yang bisa dimanipulasi klien.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return redirectTo('/', { denied: 'admin' })
    }
  }

  return supabaseResponse
}
