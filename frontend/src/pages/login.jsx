import logo from "../assets/Logo_IPB.png";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#243B91] to-white">

      <div className="w-[1120px] h-[661px] bg-white rounded-xl shadow-lg flex flex-col items-center justify-center">

        {/* Logo */}
        <img 
          src={logo} 
          alt="Logo IPB" 
          className="w-[120px] mb-6"
        />

        {/* Title */}
        <h1 className="text-6xl font-extrabold text-[#140963] drop-shadow-md leading-none">
          SAPA IPB
        </h1>

        {/* Subtitle */}
        <p className="text-xl mb-8">
          Sarana Akses Layanan Akademik
        </p>

        {/* Button */}
        <button className="w-[394px] h-[51px] bg-[#140963] text-white rounded-2xl text-lg hover:opacity-90 transition">
          Sign in with Google
        </button>

        {/* Note */}
        <p className="text-black/60 text-sm italic mt-6 text-center">
          Akses sistem dibatasi. Hanya untuk email resmi kampus
        </p>

      </div>
    </div>
  );
};

export default Login;