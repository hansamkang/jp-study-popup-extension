# 일본어 드래그 번역

영문 프로젝트명: `japanese-drag-translate`

웹페이지에서 일본어 문장을 드래그하면 마우스 근처에 한국어 번역 팝업을 보여주는 Chrome 확장 프로그램입니다.

## 주요 기능

* 일본어 드래그 감지
* 한국어 번역 팝업 표시
* 네이버 일본어 사전 링크 제공
* 선택한 문장 복사
* 팝업 하단 광고 영역 표시

## 기술 구성

* Chrome Extension Manifest V3
* Vanilla JavaScript
* Content Script 기반 팝업 UI
* Background Service Worker 기반 번역 요청

## 설치 방법

1. Chrome 주소창에 `chrome://extensions`를 입력합니다.
2. 오른쪽 위의 개발자 모드를 켭니다.
3. `압축해제된 확장 프로그램을 로드합니다`를 클릭합니다.
4. `japanese-drag-translate` 폴더를 선택합니다.

## 폴더 구조

* `manifest.json`: Chrome 확장 프로그램 설정 파일
* `content.js`: 웹페이지에서 드래그를 감지하고 팝업을 표시하는 파일
* `background.js`: 번역 API 요청을 처리하는 파일
* `style.css`: 팝업 디자인 파일
* `ads.json`: 팝업 하단 광고 데이터 파일
* `icons/`: 확장 프로그램 아이콘 파일

## 라이선스

MIT
