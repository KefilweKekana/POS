from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

from modern_pos import __version__ as version

setup(
	name="modern_pos",
	version=version,
	description="Modern, touch-friendly Point of Sale system with barcode scanning, quick checkout, and receipt printing",
	author="Your Company",
	author_email="your-email@example.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
