import React from 'react'
import { Link } from 'react-router-dom'
import '../../App.css'

const PageNotFound = () => {
  return (
    <>
    <div style={{marginTop: '15em'}}>
               <div>
                  <div style={{color: 'white', fontSize: '40px'}}>404</div>
                <p
                 style={{color: 'white'}}
                >Page not found.</p>
                 <Link  to='/'>
              <button className='pnfBtn'>back to Home</button>
              </Link>
              
        </div>
      </div>
    </>
  )
}

export default PageNotFound