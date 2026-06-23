# 청년성서모임 한처음 — 그룹공부 공간 예약 시스템

> 작성일: 2026-06-23  
> 배포 URL: https://booking-hancheoum.vercel.app

---

## 1. 프로젝트 개요

가톨릭 청소년 센터 내 한정된 공간을 여러 그룹이 충돌 없이 예약할 수 있도록 구글폼+캘린더를 완전 대체하는 모바일 웹 서비스.

| 항목 | 내용 |
|------|------|
| 서비스명 | 청년성서모임 한처음 그룹공부 예약 |
| 장소 | 가톨릭 청소년 센터 |
| 대상 | 그룹봉사자(리더) |
| 인증 | 로그인 없음 — 이름+세례명+그룹과정+개인PIN 4자리 |
| 예약 단위 | 방 × 1시간 슬롯 (08:00 ~ 24:00) |

---

## 2. 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.2.9 |
| UI 라이브러리 | React | 19.2.4 |
| 스타일링 | Tailwind CSS | 4.x |
| 데이터베이스 | Supabase (PostgreSQL) | @supabase/supabase-js 2.x |
| 엑셀 출력 | SheetJS (xlsx) | 0.18.5 |
| 배포 | Vercel | — |
| 언어 | TypeScript | 5.x |

---

## 3. Vercel 배포 정보

| 항목 | 값 |
|------|----|
| 팀(Org) | hancheoum |
| 프로젝트명 | booking |
| projectId | prj_cKUwXhLkxnuODr1uGGtNKjACD8Gz |
| orgId | team_2OJoPICwEDjBHArxWvQi3GEl |
| 프로덕션 URL | https://booking-hancheoum.vercel.app |
| 별칭 URL | https://booking-lemon-phi.vercel.app |
| 마지막 배포 ID | dpl_ENtQDcNWuACAQP6x2VtXz5MN2qa2 |
| 프레임워크 설정 | nextjs (2026-06-23 수동 설정) |

### Vercel 환경변수 (3개)

```
NEXT_PUBLIC_SUPABASE_URL        = https://cvlcjznajqeteyalvkgk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJ...  (Supabase anon key)
NEXT_PUBLIC_ADMIN_PASSWORD      = (인수인계서.docx 참조)
```

> `.env.local`은 git에 커밋하지 않음. `.mcp.json`도 동일.

---

## 4. Supabase 프로젝트

| 항목 | 값 |
|------|----|
| 프로젝트 ID | cvlcjznajqeteyalvkgk |
| 프로젝트 URL | https://cvlcjznajqeteyalvkgk.supabase.co |
| 지역 | 기본 |

---

## 5. 데이터 모델

### 5-1. `bookings` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| room_id | text | 방 ID (rooms 참조) |
| date | date | 예약일 (YYYY-MM-DD) |
| start_time | text | 시작 시간 ("HH:00") |
| end_time | text | 종료 시간 ("HH:00") |
| leader_name | text | 봉사자 이름 |
| baptismal_name | text | 세례명 |
| group_stage | text | 그룹과정 (아래 6종) |
| member_count | int | 참여 인원 수 |
| pin | text | 개인 비밀번호 4자리 |
| created_at | timestamptz | 생성일시 |

- 충돌 방지: `booking_conflict` 제약 (DB 레벨)

### 5-2. `rooms` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | text | PK (e.g. "room-1") |
| name | text | 방 이름 |
| is_active | bool | 활성 여부 |
| created_at | timestamptz | 생성일시 |

**기본 3개 방:**
- 한처음방
- 대학생방
- 다목적실

### 5-3. `notices` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| content | text | 공지 내용 |
| is_active | bool | 노출 여부 (soft delete) |
| created_at | timestamptz | 생성일시 |

### 5-4. `blocked_periods` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | text | PK |
| date | date | 차단 날짜 |
| start_time | text | 시작 시간 (nullable → 하루 전체 차단) |
| end_time | text | 종료 시간 |
| note | text | 메모 |

### 5-5. `resources` 테이블 (자료실)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| type | text | 'file' 또는 'link' |
| title | text | 제목 |
| url | text | 링크 URL |
| file_name | text | 파일명 |
| file_size | int | 파일 크기 (bytes) |
| is_active | bool | 노출 여부 |
| created_at | timestamptz | 생성일시 |

---

## 6. 그룹과정 (GroupStage) 6종

| 이름 | 색상 코드 | 배지 색상 |
|------|-----------|-----------|
| 창세기 | 파랑 (blue) | bg-blue-600 |
| 탈출기 | 초록 (green) | bg-green-600 |
| 마르코 | 빨강 (red) | bg-red-600 |
| 요한 | 회색 (gray) | bg-gray-400 |
| 사도행전 | 노랑 (yellow) | bg-yellow-500 |
| 이사야 | 분홍 (pink) | bg-pink-500 |

---

## 7. 앱 라우트 구조

```
/                   → 메인 (신원 입력 + 공지사항)
/booking            → 예약 화면 (탭 4개)
  └ 공간 예약       → 날짜 탭 + 방×시간 그리드
  └ 전체 현황       → 월별 캘린더 + 바텀시트 팝업
  └ 내 예약         → 내 예약 목록 + 취소/수정
  └ 자료실          → 파일/링크 목록
/admin              → 관리자 로그인
/admin/dashboard    → 관리자 대시보드 (탭 6개)
  └ 예약 현황       → 날짜별 예약 카드 + 강제 취소
  └ 방 관리         → 방 추가/활성화 토글
  └ 차단 관리       → 날짜/시간 차단 등록·삭제
  └ 공지사항        → 공지 등록·수정·삭제
  └ 자료실          → 파일 업로드 / 링크 등록
  └ 📥 다운로드     → 기간별 엑셀 다운로드
```

---

## 8. 주요 소스 파일

| 파일 | 역할 |
|------|------|
| `src/app/page.tsx` | 메인 진입 — 공지사항 + 신원 입력 폼 |
| `src/app/booking/page.tsx` | 예약 화면 (탭 컨트롤러) |
| `src/app/admin/page.tsx` | 관리자 로그인 |
| `src/app/admin/dashboard/page.tsx` | 관리자 대시보드 |
| `src/components/BookingGrid.tsx` | 방×시간 슬롯 그리드 |
| `src/components/BookingModal.tsx` | 예약 생성/수정 모달 |
| `src/components/DateTabs.tsx` | 날짜 탭 + 주 이동 화살표 + 달력 팝업 |
| `src/components/MyBookingsView.tsx` | 내 예약 목록 |
| `src/components/AllBookingsView.tsx` | 전체 현황 월달력 |
| `src/components/ResourceView.tsx` | 자료실 (사용자) |
| `src/components/admin/AdminDashboard.tsx` | 관리자 탭 컨테이너 |
| `src/components/admin/AdminBookings.tsx` | 관리자 예약 현황 |
| `src/components/admin/RoomManager.tsx` | 방 관리 |
| `src/components/admin/BlockManager.tsx` | 차단 관리 |
| `src/components/admin/NoticeManager.tsx` | 공지사항 관리 |
| `src/components/admin/ResourceManager.tsx` | 자료실 관리 |
| `src/components/admin/ExportView.tsx` | 엑셀 다운로드 |
| `src/lib/types.ts` | 타입 정의 (Booking, Room, Notice 등) |
| `src/lib/constants.ts` | 방 목록, 그룹색상, 시간슬롯 |
| `src/lib/storage.ts` | 예약 CRUD (Supabase) |
| `src/lib/admin-storage.ts` | 방·차단·공지·관리자 인증 (Supabase) |
| `src/lib/resource-storage.ts` | 자료실 CRUD (Supabase) |
| `src/lib/supabase.ts` | Supabase 클라이언트 초기화 |

---

## 9. 운영 시간 슬롯

- 시작: **08:00**
- 종료: **24:00** (마지막 슬롯 = 23:00)
- 단위: **1시간** (16개 슬롯)

---

## 10. 개발 히스토리 (커밋 순)

| 커밋 | 내용 |
|------|------|
| `a832405` | Next.js 초기 프로젝트 생성 |
| `c42918a` | 예약 시스템 UI, 관리자 모드, 프로젝트 문서 구축 |
| `cc109fe` | Supabase 연동 — localStorage → 영구 DB 전환 |
| `d855507` | 메인 페이지 리디자인 — 공지사항 + 신원 입력 폼 |
| `707ae77` | 전체 현황 탭 추가 — 날짜별 예약 목록 |
| `391781d` | 그룹과정 색상 코딩 + 예약 상세 팝업 추가 |
| `d0130de` | 전체 현황 → 월달력 + 바텀시트 팝업으로 교체 |
| `d2f7254` | 메인 페이지 헤더 타이틀·부제목 변경 |
| `d0d9d5e` | 신청자 입력 → 그룹봉사자 레이블 변경 |
| `39136f1` | 관리자 엑셀 다운로드 탭 추가 (SheetJS) |
| `2551bb8` | 공지사항 관리 탭 추가 + 메인 공지 스크롤 |

### 세션 내 추가 작업 (미커밋)

| 작업 | 내용 |
|------|------|
| DateTabs 리뉴얼 | ‹/› 주 이동 화살표 + 달력 팝업 버튼 통합 |
| AllBookingsView | JSX 파싱 오류 수정 (완전 재작성) |
| AdminBookings | 날짜 네비게이터 + 그룹 컬러바 카드 + 빈날 📭 이모지 |
| AdminDashboard | 탭 텍스트 줄바꿈 수정 (`whitespace-nowrap`) |
| AdminDashboard | "예약현황 다운로드" → "📥 다운로드" 레이블 변경 |
| ExportView | 상단 설명 문구 추가 |
| 방 이름 | 기본방→한처음방, 세미나1→대학생방, 세미나2→다목적실 |
| 열 색상 | 방별 컬럼에 색상 적용 (BookingGrid) |
| 공지사항 | 빨간 테두리·배경 적용 |
| Vercel 배포 | 프레임워크 null → nextjs 수동 설정 후 정상 배포 |

---

## 11. 로컬 개발 실행

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev   # http://localhost:3000

# 프로덕션 빌드
npm run build
```

### 필요한 `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://cvlcjznajqeteyalvkgk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon key>
NEXT_PUBLIC_ADMIN_PASSWORD=(인수인계서.docx 참조)
```

---

## 12. Vercel 재배포 방법

```bash
# 토큰 파일 위치: ~/.vercel/auth.json
vercel deploy --prod \
  --token "$(node -p "require(require('os').homedir()+'/.vercel/auth.json').token")" \
  --scope hancheoum
```

> 주의: `.vercel/project.json`의 framework가 `null`이면 404 발생.  
> 최초 1회 `PATCH /v9/projects/{id}` 로 `{ "framework": "nextjs" }` 설정 필요 (이미 완료).

---

## 13. 알려진 이슈 / 참고사항

- 관리자 비밀번호는 환경변수 `NEXT_PUBLIC_ADMIN_PASSWORD` (클라이언트 노출 방식 — 내부 운영 도구이므로 허용)
- PIN은 평문 저장 (예약 취소 용도로만 사용, 민감 정보 아님)
- 자료실 파일 업로드는 Supabase Storage 미연동 상태 (링크 등록만 가능)
- Vercel Hobby 플랜 — 월 100GB 대역폭, Edge Functions 제한 있음
