import { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import { format } from 'date-fns';

export default function WhatsAppMessageModal({ student, isOpen, onClose }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [messagePreview, setMessagePreview] = useState('');
  const [classes, setClasses] = useState([]);
  const fetcher = useFetcher();

  useEffect(() => {
    if (isOpen) {
      fetcher.load(`/students/classes?studentId=${student.id}&month=${selectedMonth + 1}&year=${selectedYear}`);
    }
  }, [isOpen, selectedMonth, selectedYear, student.id]);

  useEffect(() => {
    if (fetcher.data?.classes) {
      setClasses(fetcher.data.classes);
      const total = fetcher.data.classes.reduce((sum, cls) => sum + cls.lessonRate, 0);
      
      const message = `Dear ${student.name},

I hope this message finds you well! Here's your class summary for ${format(new Date(selectedYear, selectedMonth), 'MMMM yyyy')}:

${fetcher.data.classes.map(cls => 
  `${format(new Date(cls.date), 'MMM dd')} - R$ ${cls.lessonRate.toFixed(2)}`
).join('\n')}

Total amount: R$ ${total.toFixed(2)}

Thank you for your trust in my work!
Best regards.`;

      setMessagePreview(message);
    }
  }, [fetcher.data, student.name, selectedMonth, selectedYear]);

  const handleSendMessage = () => {
    if (!student.phoneNumber) {
      alert('No phone number available for this student');
      return;
    }

    const encodedMessage = encodeURIComponent(messagePreview);
    const whatsappUrl = `https://wa.me/${student.phoneNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Send WhatsApp Message</h2>
        
        <div className="mb-4 flex gap-4">
          <div>
            <label className="block mb-2">Month</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border rounded p-2"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {format(new Date(2024, i), 'MMMM')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded p-2"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Message Preview</label>
          <div className="border rounded p-4 bg-gray-50 whitespace-pre-line">
            {messagePreview}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendMessage}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={!student.phoneNumber}
          >
            Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}