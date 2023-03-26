var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
    mapOption = { 
        center: new kakao.maps.LatLng(35.53501901197653, 129.31080515022285), // 지도의 중심좌표
        level: 3 // 지도의 확대 레벨
    };

var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

// HTML5의 geolocation으로 사용할 수 있는지 확인합니다.
if (navigator.geolocation) {
    // GeoLocation을 이용해서 접속 위치를 얻어옵니다.
    navigator.geolocation.getCurrentPosition(function(position) {
        
        var lat = position.coords.latitude, // 위도
            lon = position.coords.longitude; // 경도
        
        var currentPosition = new kakao.maps.LatLng(lat, lon);

        // 현재 위치에 마커를 생성합니다.
        var currentMarker = new kakao.maps.Marker({
            position: currentPosition
        });

        // 현재 위치 마커가 지도 위에 표시되도록 설정합니다.
        currentMarker.setMap(map);

        // 지도 중심을 현재 위치로 이동시킵니다.
        map.setCenter(currentPosition);

        // 내 현재 위치 마커를 클릭했을 때 마커 위에 표시할 인포윈도우를 생성합니다
        var currentIwContent = '<div style="padding:5px;">현재위치</div>',
            currentIwRemoveable = true;

        // 내 현재 위치 인포윈도우를 생성합니다
        var currentInfowindow = new kakao.maps.InfoWindow({
            content : currentIwContent,
            removable : currentIwRemoveable
        });

        // 현재 위치 마커에 클릭 이벤트를 등록합니다
        kakao.maps.event.addListener(currentMarker, 'click', function() {
            // 현재 위치 마커 위에 인포윈도우를 표시합니다
            currentInfowindow.open(map, currentMarker);  
        });

    }, function(error) {
        // 사용자가 위치 정보 공유를 거부한 경우 처리
        console.error('Geolocation failed: ' + error.message);
    });
} else {
    // 브라우저가 geolocation을 지원하지 않는 경우
    console.error('Your browser does not support geolocation');
}


// 장소 검색 객체를 생성합니다
var ps = new kakao.maps.services.Places(map); 

// 키워드로 장소를 검색합니다
function searchPlaces() {
    // 키워드 검색 요청
    ps.keywordSearch('동물병원', placesSearchCB, {
        location: currentPosition,
        radius: 1000 // 반경 1km 이내
    });
}

// 검색 콜백 함수
function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        // 검색된 동물병원 목록을 출력합니다
        displayPlacesList(data);
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
        return;
    } else if (status === kakao.maps.services.Status.ERROR) {
        alert('검색 결과 중 오류가 발생했습니다.');
        return;
    }
}

// 검색된 동물병원 목록을 출력하는 함수입니다
function displayPlacesList(places) {
    var listEl = document.getElementById('placesList');
    listEl.innerHTML = '';

    for (var i = 0; i < places.length; i++) {
        var itemEl = getListItem(i, places[i]); // 동물병원 목록 항목 생성
        listEl.appendChild(itemEl);
    }
}

// 동물병원 목록 항목을 생성하는 함수입니다
function getListItem(index, place) {
    var el = document.createElement('li');
    el.className = 'item';

    el.innerHTML = '<span class="info">' +
                        '<span class="title">' + place.place_name + '</span>' +
                        '<span class="address">' + place.address_name + '</span>' +
                    '</span>';

    return el;
}

// 현재 위치 마커에 클릭 이벤트를 등록합니다
kakao.maps.event.addListener(currentMarker, 'click', function() {
    // 현재 위치 마커 위에 인포윈도우를 표시합니다
    currentInfowindow.open(map, currentMarker);  
    
    // 현재 위치 주변 동물병원 검색
    searchPlaces();
});