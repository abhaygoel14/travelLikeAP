import React, { useRef } from 'react'
import './search-bar.css'
import { Col, Form, FormGroup } from 'reactstrap'
import { BASE_URL } from '../utils/config'
import { useNavigate } from 'react-router-dom'

const SearchBar = () => {
   const locationRef = useRef('')
   const distanceRef = useRef(0)
   const startDateRef = useRef('')
   const endDateRef = useRef('')
   const navigate = useNavigate()

   const searchHandler = async() => {
      const location = locationRef.current.value
      const distance = distanceRef.current.value
      const startDate = startDateRef.current.value
      const endDate = endDateRef.current.value

      if (
         location === '' ||
         distance === '' ||
         startDate === '' ||
         endDate === ''
      ) {
         return alert('All fields are required!')
      }

      if (new Date(startDate) > new Date(endDate)) {
         return alert('Start date must be before end date')
      }

      const params = new URLSearchParams({
         city: location,
         distance,
         startDate,
         endDate,
         
      })

      const res = await fetch(`${BASE_URL}/tours/search/getTourBySearch?${params.toString()}`)

      if(!res.ok) return alert('Something went wrong')

      const result = await res.json()

      navigate(`/tours/search?${params.toString()}`, { state: result.data })
   }

   return <Col lg="12">
      <div className="search__bar">
         <Form className='d-flex align-items-center gap-4'>
            <FormGroup className='d-flex gap-3 form__group form__group-fast'>
               <span><i class='ri-map-pin-line'></i></span>
               <div>
                  <h6>Location</h6>
                  <input type="text" placeholder='Where are you going?' ref={locationRef} />
               </div>
            </FormGroup>
            <FormGroup className='d-flex gap-3 form__group form__group-fast'>
               <span><i class='ri-map-pin-time-line'></i></span>
               <div>
                  <h6>Distance</h6>
                  <input type="number" placeholder='Distance k/m' ref={distanceRef} />
               </div>
            </FormGroup>

            <FormGroup className='d-flex gap-3 form__group'>
               <span><i class='ri-calendar-line'></i></span>
               <div>
                  <h6>Start Date</h6>
                  <input type="date" ref={startDateRef} />
               </div>
            </FormGroup>

            <FormGroup className='d-flex gap-3 form__group'>
               <span><i class='ri-calendar-line'></i></span>
               <div>
                  <h6>End Date</h6>
                  <input type="date" ref={endDateRef} />
               </div>
            </FormGroup>

            

            <span className='search__icon' type='submit' onClick={searchHandler}>
               <i class='ri-search-line'></i>
            </span>
         </Form>
      </div>
   </Col>
}

export default SearchBar