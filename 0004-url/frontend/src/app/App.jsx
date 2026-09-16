import { useState, useEffect } from 'react'
import axios from "axios"

import './App.css'


const dummyUrls = [
  {
    _id: "1",
    originalUrl: "https://www.amazon.in/s?k=dancing+cactus&i=toys&s=exact-aware-popularity-rank&ds=v1%3Ab%2BSw44ZvzhORklnWYW%2F09u9IzkAIAkk8r5Zql%2Fs3nso&_encoding=UTF8&_encoding=UTF8&content-id=amzn1.sym.b8899ac9-602c-49de-a4d4-9b889f6889d0&crid=3MRAAI2ZAPWM6&pd_rd_r=8b0cb029-bb54-4c28-81f6-f2b616a1e8f4&pd_rd_w=hBCOq&pd_rd_wg=wDI9d&pf_rd_p=b8899ac9-602c-49de-a4d4-9b889f6889d0&pf_rd_r=9FP1P0DKH9QT8JXZ5G0V&qid=1779019626&sprefix=dancing+cact%2Ctoys%2C280&ref=pd_hp_d_r_atf_unk",
    shortCode: "IUSJDF",
    clicks: 9
  },
  {
    _id: "2",
    originalUrl: "https://www.amazon.in/s?k=dancing+cactus&i=toys&s=exact-aware-popularity-rank&ds=v1%3Ab%2BSw44ZvzhORklnWYW%2F09u9IzkAIAkk8r5Zql%2Fs3nso&_encoding=UTF8&_encoding=UTF8&content-id=amzn1.sym.b8899ac9-602c-49de-a4d4-9b889f6889d0&crid=3MRAAI2ZAPWM6&pd_rd_r=8b0cb029-bb54-4c28-81f6-f2b616a1e8f4&pd_rd_w=hBCOq&pd_rd_wg=wDI9d&pf_rd_p=b8899ac9-602c-49de-a4d4-9b889f6889d0&pf_rd_r=9FP1P0DKH9QT8JXZ5G0V&qid=1779019626&sprefix=dancing+cact%2Ctoys%2C280&ref=pd_hp_d_r_atf_unk",
    shortCode: "IUSJDF",
    clicks: 5
  },
  {
    _id: "3",
    originalUrl: "https://www.amazon.in/s?k=dancing+cactus&i=toys&s=exact-aware-popularity-rank&ds=v1%3Ab%2BSw44ZvzhORklnWYW%2F09u9IzkAIAkk8r5Zql%2Fs3nso&_encoding=UTF8&_encoding=UTF8&content-id=amzn1.sym.b8899ac9-602c-49de-a4d4-9b889f6889d0&crid=3MRAAI2ZAPWM6&pd_rd_r=8b0cb029-bb54-4c28-81f6-f2b616a1e8f4&pd_rd_w=hBCOq&pd_rd_wg=wDI9d&pf_rd_p=b8899ac9-602c-49de-a4d4-9b889f6889d0&pf_rd_r=9FP1P0DKH9QT8JXZ5G0V&qid=1779019626&sprefix=dancing+cact%2Ctoys%2C280&ref=pd_hp_d_r_atf_unk",
    shortCode: "IUSJDF",
    clicks: 4
  },
]

function App() {

  const [ urls, setUrls ] = useState(dummyUrls)
  const [ inputValue, setInputValue ] = useState("")
  const [ currentUrl, setCurrentUrl ] = useState(null)


  async function fetchUrls() {

    const response = await axios.get("http://localhost:5173/api/url")

    const responseData = response.data

    setUrls(responseData.data.urls)

    console.log(responseData)

  }

  async function createShortUrl() {

    const response = await axios.post("http://localhost:5173/api/url", {
      url: inputValue
    })

    setCurrentUrl({
      originalUrl: response.data.data.originalUrl,
      shortCode: response.data.data.shortCode
    })

    fetchUrls()

  }

  async function deleteUrl(id) {
    await axios.delete(`http://localhost:5173/api/url/${id}`)

    fetchUrls()
  }

  useEffect(() => {
    fetchUrls()
  }, [])

  return (
    <main className='p-10 flex flex-col gap-4' >
      <div className='w-full max-w-4xl p-2 flex gap-2' >
        <input
          type="text"
          placeholder='Enter Long URL'
          value={inputValue}
          className='border rounded w-full p-2'
          onChange={(e) => { setInputValue(e.target.value) }}
        />
        <button
          className='rounded p-2 bg-orange-600 text-white cursor-pointer'
          onClick={createShortUrl}
        >Shorten</button>
      </div>
      <div className='w-full max-w-4xl p-2 ' ></div>
      <div className='w-full max-w-4xl p-2 flex flex-col gap-2' >
        {
          urls.map(url => {
            return (
              <div className='border border-neutral-200 p-2 flex gap-8 justify-evenly items-center' >
                <a href={`http://localhost:3000/${url.shortCode}`} target='_blank' >{url.shortCode}</a>
                <p className='truncate' >{url.originalUrl}</p>
                <p>{url.clicks}</p>
                <div className='flex gap-2' >
                  <button className='p-2 rounded bg-orange-600 text-white cursor-pointer' >COPY</button>
                  <button
                    onClick={() => deleteUrl(url._id)}
                    className='p-2 rounded bg-orange-600 text-white cursor-pointer' >DELETE</button>
                </div>
              </div>
            )
          })
        }

      </div>
    </main>
  )
}

export default App
