import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import moment from 'moment';
import {get} from 'lodash';
import { getAll, create } from './services/api'
import 'moment/locale/id';
import './App.css';


function App() {
  const [rawSchedule, setRawSchedule] = useState({})
  const [schedules, setSchedules] = useState({})
  const [showModal, setShowModal] = useState(false)

  async function getSchedules(){
    await getAll().then((response) => {
      if (response.status >= 400 && response.status < 600) {
        throw new Error("Bad response from server");
      }
      return response.json();
    }).then((returnedResponse) => {
      const data = returnedResponse
      const schedules = {}
      //group random schedule by date
      Array.isArray(data) && data.forEach(detail => {
        let listSchedule = schedules[detail.tanggal] || []
        listSchedule.push(detail)
        schedules[detail.tanggal] = listSchedule
      });
      //sort the schedules descending
      const orderedSchedules = Object.keys(schedules).sort(
        (a, b) =>
          moment.utc(a,'DD MMMM YYYY', 'id').format("YYYYMMDD") -
          moment.utc(b,'DD MMMM YYYY', 'id').format("YYYYMMDD")
      ).reverse().reduce(
        (obj, key) => { 
          obj[key] = schedules[key]; 
          return obj;
        }, 
        {}
      );
      setSchedules(orderedSchedules);
      setRawSchedule(data)
    }).catch((error) => {
      console.log(error)
    });
  }
  
  function sumPrice(list, priceKey){
    const total = Array.isArray(list) ? list.reduce( function(a, b){
      return a + Number(b[priceKey]);
    }, 0) : 0;
    
    return total
  }
  
  function getTotalPrice(){
    const moneyPerMonth = []
    Object.keys(schedules).forEach(x => {
      moneyPerMonth.push(sumPrice(schedules[x], 'pengeluaraan'))
    })
    const total = moneyPerMonth.reduce( function(a, b){
      return a + b;
    }, 0)
    return total
  }
  
  function getMonths(){
    const monthGroup = []
    Object.keys(schedules).forEach(x => {
      const text = x.split(' ')
      const monthYear = `${text[1]} ${text[2]}`
      if(!monthGroup.includes(monthYear)){
        monthGroup.push(monthYear)
      }
    })
    return monthGroup.length > 1 ? `${monthGroup[0]} - ${monthGroup[monthGroup.length - 1]}` : monthGroup[0]
  }

  async function submitSchedule(e){
    e.preventDefault();
    const { nama, harga } = get(e, 'target.elements', {});
    const oldData = rawSchedule.slice();
    const tanggal = moment(new Date()).locale('id').format('LLL').split(' pukul ');
    const payload = {
      jam : tanggal[1],
      tanggal : tanggal[0],
      nama: nama.value,
      pengeluaraan: harga.value,
      id: oldData[oldData.length - 1].id ? oldData[oldData.length - 1].id + 1 : 1
    }   
    
    await create(payload)
      .then(() => {
        e.target.reset();
        getSchedules();
        setShowModal(false)
      })
      .catch((error) => {
        console.log(error)
      });
  }
  
  useEffect(() => {
    getSchedules()
  }, [])
  
  return (
    <div className="App">
      <h3 className="heading">Diari Jajan {getMonths()}</h3>
      <h4 className="sub-heading">Pengeluaran Jajan ku Rp {getTotalPrice().toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".")}</h4>
      <Button variant="primary" onClick={() => setShowModal(true)} className="add-button">
        Tambah Jajanan
      </Button>
      <Row>
        {
          Object.keys(schedules).map((scheduleDate, i) => (
            <Col className="card-container" xs={12} lg={4} xxl={3} key={i}>
              <Card className="card">
                <div className="title">{scheduleDate}</div>
                <div>
                {Array.isArray(schedules[scheduleDate]) && schedules[scheduleDate].map((schedule,i) => (
                  <Row className="schedule" key={i}>
                    <Col className="property" xs={2}>
                      {get(schedule, 'jam', '')}
                    </Col>
                    <Col className="property" xs={6}>
                      {get(schedule, 'nama', '')}
                    </Col>
                    <Col className="property price-tag" xs={4}>
                      Rp {get(schedule, 'pengeluaraan', '').toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".")} 
                      {/* the typo (pengeluaraan) is from the json type */}
                    </Col>
                  </Row>
                ))}
                </div>
                <Row className="total">
                  <Col xs={6}>Total</Col>
                  <Col xs={6} className="price-tag">
                    Rp {sumPrice(schedules[scheduleDate], "pengeluaraan").toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".")}
                    {/* the typo (pengeluaraan) is from the json type */}
                  </Col>
                </Row>

              </Card> 
            </Col>
          ))
        }
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Form onSubmit={submitSchedule}>
          <Modal.Header closeButton>
            <Modal.Title>Tambah Jajanan</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nama Jajanan</Form.Label>
              <Form.Control type="text" placeholder="Masukkan Nama" name="nama" required/>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Harga</Form.Label>
              <Form.Control type="number" placeholder="Masukkan Harga" name="harga" required/>
            </Form.Group> 
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="primary" type='submit'>
              Tambahkan
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default App;
