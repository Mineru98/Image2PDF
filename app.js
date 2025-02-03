// 모듈 로딩 (CDN 사용 중이라 window.jspdf 로 접근)
const { jsPDF } = window.jspdf;

const dropzone = document.getElementById('dropzone');
const preview = document.getElementById('preview');
const generatePDFButton = document.getElementById('generatePDF');
const resetButton = document.getElementById('reset');

// 드래그 앤 드롭으로 받아온 File 객체들을 저장할 배열
let imageFiles = [];

/**
 * 드롭 영역에 기본 이벤트 막기
 */
;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, (e) => e.preventDefault());
});

dropzone.addEventListener('dragover', () => {
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

/**
 * drop 이벤트에서 이미지 파일만 필터링 후 처리
 */
dropzone.addEventListener('drop', (e) => {
  dropzone.classList.remove('dragover');
  
  // 드롭된 파일 목록
  const droppedFiles = [...e.dataTransfer.files];
  
  // 이미지 파일만 필터링
  const validImageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));

  if (validImageFiles.length === 0) {
    alert('이미지 파일만 업로드할 수 있습니다.');
    return;
  }

  // imageFiles 배열에 합침
  imageFiles = [...imageFiles, ...validImageFiles];

  // 미리보기 갱신
  renderPreview();

  // PDF 생성 버튼 활성화
  generatePDFButton.disabled = false;
  resetButton.disabled = false;
});

/**
 * 이미지 미리보기 렌더링
 */
function renderPreview() {
  preview.innerHTML = '';

  imageFiles.forEach((file) => {
    const imgElement = document.createElement('img');
    imgElement.file = file;
    preview.appendChild(imgElement);

    // FileReader를 이용해서 썸네일 미리보기
    const reader = new FileReader();
    reader.onload = (e) => {
      imgElement.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}


resetButton.addEventListener('click', () => {
    // 이미지 파일 배열 초기화
    imageFiles = [];
  
    // 미리보기 영역 비우기
    preview.innerHTML = '';
  
    // 드롭존 클래스 초기화
    dropzone.classList.remove('dragover');
  
    // 버튼 비활성화
    generatePDFButton.disabled = true;
    resetButton.disabled = true;
});

/**
 * PDF 생성 버튼 클릭
 */
generatePDFButton.addEventListener('click', async () => {
  if (imageFiles.length === 0) return;

  // jsPDF 객체 생성 (A4 용지 세로 방향)
  const pdf = new jsPDF('p', 'pt', 'a4');

  // A4 용지 너비/높이 (pt 단위)
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];

    // FileReader를 통해 이미지를 base64 데이터로 변환
    const base64Image = await fileToBase64(file);
    
    // 이미지를 PDF에 맞게 축소/맞춤
    // (예시: 너비에 맞추고 비율만큼 높이 조정)
    const imgProps = await getImageDimensions(base64Image);
    
    const ratio = imgProps.height / imgProps.width;
    const pdfImgWidth = pageWidth * 0.9; // 여백을 위해 90% 정도만 사용
    const pdfImgHeight = pdfImgWidth * ratio;

    // 페이지에 이미지 추가
    // x, y 좌표는 여백으로 5% 정도 사용
    pdf.addImage(
      base64Image,
      'PNG',                 // 이미지 포맷 (JPG, PNG 등)
      pageWidth * 0.05,     // x 시작점
      pageHeight * 0.05,    // y 시작점
      pdfImgWidth,          // 이미지 너비
      pdfImgHeight          // 이미지 높이
    );

    // 마지막 이미지가 아니라면 새 페이지 추가
    if (i < imageFiles.length - 1) {
      pdf.addPage();
    }
  }

  // PDF 다운로드
  pdf.save('download.pdf');
});

/**
 * File 객체를 base64 문자열로 변환하는 함수
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * base64 이미지를 로드해서 가로/세로 크기를 반환하는 함수
 */
function getImageDimensions(base64Data) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = base64Data;
  });
}