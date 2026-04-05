import { useEffect, useState } from 'react'
import './App.css'

// ສ້າງ Type ສຳລັບຂໍ້ມູນເມນູ (ຖ້າໃຊ້ TypeScript)
interface MenuItem {
  id: number;
  name: string;
  price: string;
  category: string;
}

function App() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ດຶງຂໍ້ມູນຈາກ Backend ທີ່ເຮົາເຮັດໄວ້
    fetch('http://localhost:5000/api/menus')
      .then((res) => res.json())
      .then((data) => {
        setMenus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching menus:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <h1>ບັດລາຍການອາຫານ 📋</h1>
      
      {loading ? (
        <p>ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
      ) : (
        <div className="menu-grid">
          {menus.map((item) => (
            <div key={item.id} className="menu-card">
              <h3>{item.name}</h3>
              <p className="category">ປະເພດ: {item.category}</p>
              <p className="price">ລາຄາ: {Number(item.price).toLocaleString()} ກີບ</p>
              <button className="order-btn">ສັ່ງເລີຍ 🛒</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App