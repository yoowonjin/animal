//지도생성옵션
    const defaultPosition = new naver.maps.LatLng('35.53910648101849','129.31192013338963')
    const mapOptions = {
      center: defaultPosition,
      zoom : 16
    };
    //지도생성
    const map = new naver.maps.Map(
      document.getElementById('map'),
      mapOptions);

  const p = new Promise( (s,f) =>{
        //1.비동기 처리
        const xhr = new XMLHttpRequest();
        const url = 'https://jsonplaceholder.typicode.com/users';
        xhr.open('GET',url);
        xhr.send();

        //2.비동기 처리결과
        xhr.addEventListener('load',e=>{
            if(xhr.status == 200){
                s(JSON.parse(xhr.response));
            }else{
                f(new Error('fail'));
            }
        });
    });
    function addUser(users){
        const positions = [];
          users.forEach(user => positions.push(user.address.geo)); //[{lat,lng},...]
          positions.forEach(position=>{
            makeMarker(new naver.maps.LatLng(position));
          });
        }

        p.then(addUser)
            .catch(console.log)
            .finally(console.log('finally수행됨'));

    

    //마커 생성하는 함수
    //매개변수(좌표,툴팁), 반환값:마커객체  
    function makeMarker(position,toolTip){  
      //마커 컨텐트
      const markerContent = `<div id="default_position_marker"></div>`;
      
      //마커생성옵션  
      const defaultPositionMarkerOption =  {
              map:map,
              position: position,
              title: toolTip,   //툴팁
              icon: {
                content : markerContent
              }
      }
      //마커생성
      const defaultPositionMarker = new naver.maps.Marker(defaultPositionMarkerOption);  

      return defaultPositionMarker;
    }

    //정보창 컨텐트
    //업체명,연락처,홈페이지
    const makeContentsOfInfoWindow = (company,contact,homepage)=>{
      const $html = `<div class="info_window_wrap">
                      <div class="info_window_wrap__company_name">${company}</div>
                      <div class="info_widow_wrap__contact">${contact}</div>
                      <div class="info_widow_wrap__homepage"><a href='${homepage}' target='_blank'>${homepage}</a></div>
                    </div>`;
      return $html;
    }
    const defaultPositionMarkerInfoWindowOption = {
      content : makeContentsOfInfoWindow('공백','',''),
      anchorSize : new naver.maps.Size(10,10)
    }
    //정보창 생성
    const defaultPositionMarkerInfoWindow = new naver.maps.InfoWindow(defaultPositionMarkerInfoWindowOption);

    //마커에 이벤트 핸들러 등록하기
    const defaultPositionMarker = makeMarker(defaultPosition,'태화강역');
    naver.maps.Event.addListener(defaultPositionMarker,'click',(e)=>{
      //지도상에 마커의 정보창이 있으면 정보창을 닫고 없으면 정보창 띄우기
      if(defaultPositionMarkerInfoWindow.getMap()){
        defaultPositionMarkerInfoWindow.close();
      }else{
        defaultPositionMarkerInfoWindow.open(map,defaultPositionMarker);
      }
    });

    //내위치정보 받아오기
    const myps = document.getElementById('myps');
    let myPosition = '';
    myps.addEventListener('click',e=>{
      const geolocation = globalThis.navigator.geolocation;
      if(geolocation){
        geolocation.getCurrentPosition((position)=>{
          //내위치의 위도,경도
          myPosition = new naver.maps.LatLng(position.coords.latitude,position.coords.longitude);  
          //내위치 마커표시
          const marker = makeMarker(myPosition,'내위치');
          marker.setIcon({
            content : `<div class='whereIam'></div>`
          })
          //내위치로 지도중심이동
          map.setCenter(myPosition);
          //지도의 줌레벨 조정
          map.setZoom(20);
        });
      }else{
        throw new Error('현 브라우저는 위치정보를 제공하지 않습니다');
      }
    });

    //키워드 검색
    const places = new kakao.maps.services.Places(map);

    const findedData = (function(){
      const markers = [];
      return (data, status, pagination)=>{
        if (status === kakao.maps.services.Status.OK) {
          //기존 마커 제거
          if(markers){
            markers.forEach(marker=>marker.setMap(null));
          }
          console.log(data,status,pagination);
          //좌표경계 생성
          const bounds = new naver.maps.LatLngBounds();
          data.forEach(ele=>{
            const latLng = new naver.maps.LatLng(ele.y,ele.x); 
            //마커생성
            const marker = makeMarker( latLng, ele.place_name);
            markers.push(marker);

            //정보창 생성 옵션
            const infoWinOption = {
              content : makeContentsOfInfoWindow(ele.place_name,ele.phone,ele.place_url),
              anchorSize : new naver.maps.Size(10,10)
            }
            //정보창 생성
            const infowin = new naver.maps.InfoWindow(infoWinOption);

            //마커에 클릭 이벤트 핸들러 등록
            naver.maps.Event.addListener(marker,'click',e=>{
              //지도상에 마커의 정보창이 있으면 정보창을 닫고 없으면 정보창 띄우기
              if(infowin.getMap()){
                infowin.close();
              }else{
                infowin.open(map,marker);
              }
            });
            //좌표경계 확장
            bounds.extend(latLng);
          });
          //좌표경계로 지도중심 이동
          map.panToBounds(bounds);
        }
      }
    }());

    // 키워드 검색
    const searchStart = keyword => {
      
      let location = null;

      //네이버 API LatLng객체 => 카카오 API LatLng객체로 변환
      if(myPosition) {
        // 내위치로 부터 키워드 검색
        location =  new kakao.maps.LatLng(myPosition.lat(), myPosition.lng());
      }else{
        // 지도 중심 좌표로부터 키워드 검색
        location = new kakao.maps.LatLng(map.getCenter().lat(), map.getCenter().lng());
      }

      const options = {
        category_group_code: 'PM9',
        location: location
                // radius : 5000  //0~20000 (단위 m)
        // category_group_code String : 키워드 필터링을 위한 카테고리 코드
              // MT1 대형마트
              // CS2 편의점
              // PS3 어린이집, 유치원
              // SC4 학교
              // AC5 학원
              // PK6 주차장
              // OL7 주유소, 충전소
              // SW8 지하철역
              // BK9 은행
              // CT1 문화시설
              // AG2 중개업소
              // PO3 공공기관
              // AT4 관광명소
              // AD5 숙박
              // FD6 음식점
              // CE7 카페
              // HP8 병원
              // PM9 약국
        // location LatLng : 중심 좌표. 특정 지역을 기준으로 검색한다.
        // x Number : x 좌표, longitude, location 값이 있으면 무시된다.
        // y Number : y 좌표, latitude, location 값이 있으면 무시된다.
        // radius Number : 중심 좌표로부터의 거리(반경) 필터링 값. location / x , y / useMapCenter 중 하나와 같이 써야 의미가 있음. 미터(m) 단위. 기본값은 5000, 0~20000까지 가능
        // bounds LatLngBounds : 검색할 사각형 영역
        // rect String : 사각 영역. 좌x,좌y,우x,우y 형태를 가짐. bounds 값이 있으면 무시된다.
        // size Number : 한 페이지에 보여질 목록 개수. 기본값은 15, 1~15까지 가능
        // page Number : 검색할 페이지. 기본값은 1, size 값에 따라 1~45까지 가능
        // sort SortBy : 정렬 옵션. DISTANCE 일 경우 지정한 좌표값에 기반하여 동작함. 기본값은 ACCURACY (정확도 순)
        // useMapCenter Boolean : 지정한 Map 객체의 중심 좌표를 사용할지의 여부. 참일 경우, location 속성은 무시된다. 기본값은 false
        // useMapBounds Boolean : 지정한 Map 객체의 영역을 사용할지의 여부. 참일 경우, bounds 속성은 무시된다. 기본값은 false
      };

      places.keywordSearch(keyword, findedData, options);
    }

    //검색버튼 클릭시 검색 시작
    const $searchBtn = document.getElementById('searchBtn');
    $searchBtn.addEventListener('click', e => {
      searchStart($keyword.value);
    },false);

    // 검색창 엔터시 검색 시작
    const $keyword = document.getElementById('keyword');
    $keyword.addEventListener('keydown',e=>{
      if(e.key != 'Enter') return;
      searchStart($keyword.value);
    },false);
