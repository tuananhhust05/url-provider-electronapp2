import { useState } from "react";
import { useEffect } from "react";
const courses= [{id:"1",name:"Tiếng anh"},{id:"2",name:"Tiếng pháp"}]
export default function Test() {
  const [checked, setChecked]=useState([]);// dữ liệu state là 1 mảng có giá trị bằng với mảng truyền vào 
  const handleCheck=(id) =>{
     setChecked( prev=>{
       const isChecked =checked.includes(id)
       if(isChecked){
         return checked.filter(item=>item!==id) // để lại những đối tượng khác thằng id
       }
       else{
         return[...prev,id] 
       }
     })
  }

  const handleSubmit =()=>{
    console.log({id:checked})
  }


  return (
      <div className="App" style={{padding:20}}>
        {courses.map(course =>(
          <div key={course.id}>
            <input type="checkbox"
            checked={checked.includes(course.id)}// trả về boolen
            onChange={()=>handleCheck(course.id)}
            />
            {course.name}
          </div>
        ))}
      <button onClick={handleSubmit}>Submit</button>
    </div>

  );
}
